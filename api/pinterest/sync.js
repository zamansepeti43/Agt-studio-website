import { createHash } from 'node:crypto';
import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from '../etsy/_lib.js';
import { pinterestFetch, supabaseRest, dispatchPushNotification } from './_lib.js';

const SUPABASE_CRON_TOKEN_SHA256 = 'b5915c72b16197393050acda5bb3376fb5a7fa1a6da1e68393eaf0e7dbea4ae6';

function isCronAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = String(req.headers.authorization || '');
  return auth === `Bearer ${secret}`;
}

function isSupabaseCronAuthorized(req) {
  const token = String(req.headers['x-agt-cron-token'] || '');
  if (!token) return false;
  const digest = createHash('sha256').update(token).digest('hex');
  return digest === SUPABASE_CRON_TOKEN_SHA256;
}

async function authorize(req) {
  if (isCronAuthorized(req) || isSupabaseCronAuthorized(req)) return { role: 'cron', user: null };
  const user = await requireAdminRequest(req);
  return { role: 'admin', user };
}

function chooseBoard(title, rules) {
  const normalized = String(title || '').toLowerCase();
  return [...rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority)
    .find((rule) =>
      (rule.keywords || []).some((keyword) =>
        normalized.includes(String(keyword).toLowerCase())
      )
    ) || null;
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9çğıöşü\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function updatePinterestBoardDescription(boardId, description) {
  if (!boardId || !description) return;
  await pinterestFetch(`/boards/${encodeURIComponent(boardId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ description }),
  });
}

async function listPinterestBoards() {
  const boards = [];
  let bookmark = null;
  do {
    const query = new URLSearchParams({ page_size: '250' });
    if (bookmark) query.set('bookmark', bookmark);
    const data = await pinterestFetch(`/boards?${query.toString()}`);
    boards.push(...(data?.items || []));
    bookmark = data?.bookmark || null;
  } while (bookmark);
  return boards;
}

async function ensurePinterestBoards(rules, boards) {
  const resolved = [...boards];

  for (const rule of rules || []) {
    if (rule?.board_id || !rule?.board_name) continue;

    const target = normalizeName(rule.board_name);
    const existing = resolved.find((board) => normalizeName(board.name) === target);
    if (existing?.id) {
      rule.board_id = existing.id;
      rule.board_name = existing.name;
      continue;
    }

    const created = await pinterestFetch('/boards', {
      method: 'POST',
      body: JSON.stringify({
        name: rule.board_name,
        description: rule.description || `AGT Studio — ${rule.board_name}`,
      }),
    });

    if (created?.id) {
      rule.board_id = created.id;
      rule.board_name = created.name || rule.board_name;
      resolved.push(created);
    }
  }

  return { rules, boards: resolved };
}

function resolveBoardRule(rule, boards) {
  if (rule?.board_id) return rule;
  const target = normalizeName(rule?.board_name);
  if (!target) return rule;
  const exact = boards.find((board) => normalizeName(board.name) === target);
  if (exact) return { ...rule, board_id: exact.id, board_name: exact.name };
  const partial = boards.find((board) => {
    const name = normalizeName(board.name);
    return name.includes(target) || target.includes(name);
  });
  return partial
    ? { ...rule, board_id: partial.id, board_name: partial.name }
    : rule;
}

function pinterestImageUrl(listing, title, price) {
  const source = listing.images?.[0]?.url_760xN || listing.images?.[0]?.url_570xN;
  if (!source) return null;

  const params = new URLSearchParams({ title, src: source });
  if (price) params.set('price', price);
  return `https://agt-studio.vercel.app/api/pinterest/image?${params.toString()}`;
}

function formatPrice(listing) {
  const amount = listing.price?.amount;
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: listing.price?.currency_code || 'TRY',
  }).format(amount / (listing.price?.divisor || 100));
}

function istanbulDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function nextPublishAt(publishedAt) {
  const now = new Date();
  const today = istanbulDate(now);
  const lastPublishedDay = publishedAt ? istanbulDate(publishedAt) : null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);

  let targetDay = today;
  if (lastPublishedDay === today || hour >= 19) {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    targetDay = istanbulDate(tomorrow);
  }
  return `${targetDay}T19:00:00+03:00`;
}

// Build a valid Istanbul-local schedule for each hourly product slot.
// 18 ürün için 00:15'ten başlayıp saatlik ilerler.
function scheduledAtForSlot(dayOffset, productIndex, startHour = 0) {
  const targetDay = istanbulDate(new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000));
  const base = new Date(`${targetDay}T${String(startHour).padStart(2, '0')}:15:00+03:00`);
  base.setTime(base.getTime() + productIndex * 60 * 60 * 1000);
  return base.toISOString();
}
async function syncQueue() {
  const { shopUserId } = await getEtsyAccessToken();
  const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
  if (!shop?.shop_id) throw new Error('Etsy shop ID alınamadı.');

  const query = new URLSearchParams({
    state: 'active',
    limit: '100',
    offset: '0',
    sort_on: 'created',
    includes: 'Images',
  });
  const data = await etsyApiFetch(`/shops/${shop.shop_id}/listings?${query.toString()}`);
  const listings = data?.results || [];

  if (listings.length > 24) {
    throw new Error('Pinterest günlük saat planı 24 ürüne kadar destekleniyor. 24 veya daha az aktif Etsy ilanı olmalı.');
  }

  const rules = await supabaseRest(
    'pinterest_board_rules?select=*&enabled=eq.true&order=priority.asc'
  );

  let resolvedRules = rules || [];
  let pinterestConnected = true;

  try {
    let pinterestBoards = await listPinterestBoards();
    const ensured = await ensurePinterestBoards(rules || [], pinterestBoards);
    pinterestBoards = ensured.boards;
    resolvedRules = (ensured.rules || []).map((rule) => resolveBoardRule(rule, pinterestBoards));

    for (const rule of resolvedRules) {
      if (rule.board_id && rule.description) {
        await updatePinterestBoardDescription(rule.board_id, rule.description);
      }
    }

    for (const rule of resolvedRules) {
      const original = (rules || []).find((item) => item.id === rule.id);
      if (rule.board_id && rule.board_id !== original?.board_id) {
        await supabaseRest(
          `pinterest_board_rules?id=eq.${encodeURIComponent(rule.id)}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              board_id: rule.board_id,
              updated_at: new Date().toISOString(),
            }),
          }
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/OAuth|token|authorization|Pinterest bağlantısı/i.test(message)) {
      pinterestConnected = false;
    } else {
      throw error;
    }
  }

  // One Pin per active Etsy product per day, one hour apart.
  // Each product advances to its next image every day. When the last image
  // is published, the next day starts the sequence again from image 1.
  const now = new Date();
  const today = istanbulDate(now);
  const startHour = 0; // Türkiye saati; ilk slot 00:15, sonra saatlik.

  for (let productIndex = 0; productIndex < listings.length; productIndex += 1) {
    const listing = listings[productIndex];
    const listingId = Number(listing.listing_id);
    const title = String(listing.title || 'AGT Studio Digital Tool');
    const etsyUrl = listing.url || `https://www.etsy.com/listing/${listingId}`;
    const board = chooseBoard(title, resolvedRules);
    const images = (listing.images || [])
      .map((image) => image?.url_760xN || image?.url_570xN || image?.url_fullxfull)
      .filter(Boolean);

    if (!images.length) continue;

    const existing = await supabaseRest(
      `pinterest_automation?select=*&etsy_listing_id=eq.${listingId}&order=image_index.asc`
    );

    const imageCount = images.length;

    // When the full image sequence is completed, start a fresh cycle.
    // Example: 8 images => days 1-8 publish images 1-8, day 9 starts again
    // with image 1. Subsequent cycles are automatic; only the first cycle
    // of a newly discovered product requires admin approval.
    const cycleCompleted =
      existing.length >= imageCount &&
      existing.slice(0, imageCount).every((item) => item.status === 'completed');

    if (cycleCompleted) {
      for (let imageIndex = 0; imageIndex < imageCount; imageIndex += 1) {
        const row = existing.find((item) => Number(item.image_index) === imageIndex);
        if (!row) continue;

        const scheduledAt = scheduledAtForSlot(imageIndex + 1, productIndex, startHour);

        await supabaseRest(
          `pinterest_automation?id=eq.${encodeURIComponent(row.id)}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              source_image_url: images[imageIndex],
              generated_image_url: pinterestImageUrl(listing, title, formatPrice(listing)),
              image_count: imageCount,
              scheduled_at: scheduledAt,
              status: 'ready',
              approval_status: 'approved',
              approved_at: row.approved_at || new Date().toISOString(),
              pin_id: null,
              published_at: null,
              completed_at: null,
              last_error: null,
              last_synced_at: new Date().toISOString(),
            }),
          }
        );
      }
    }

    const cycleRows = cycleCompleted
      ? await supabaseRest(
          `pinterest_automation?select=*&etsy_listing_id=eq.${listingId}&order=image_index.asc`
        )
      : existing;

    // Keep existing image rows; add/update only missing images.
    for (let imageIndex = 0; imageIndex < imageCount; imageIndex += 1) {
      const sourceImageUrl = images[imageIndex];
      const generatedImageUrl = pinterestImageUrl(listing, title, formatPrice(listing));
      const existingRow = (cycleRows || []).find((item) => Number(item.image_index) === imageIndex);

      if (existingRow?.status === 'published' || existingRow?.status === 'completed') {
        continue;
      }

      // Her ürün günde yalnızca 1 görsel yayınlanır. Aynı ürünün sonraki görseli
      // bir sonraki gün aynı saat dilimine planlanır.
      const existingSchedule = existingRow?.scheduled_at;
      const dayOffset = imageIndex + 1;
      const scheduledAt = scheduledAtForSlot(dayOffset, productIndex, startHour);

      const payload = {
        etsy_listing_id: listingId,
        etsy_title: title,
        etsy_url: etsyUrl,
        source_image_url: sourceImageUrl,
        generated_image_url: generatedImageUrl,
        pin_title: title,
        pin_description: `${title} — AGT Studio digital product on Etsy.`,
        board_id: board?.board_id || null,
        board_name: board?.board_name || null,
        image_index: imageIndex,
        image_count: imageCount,
        scheduled_at: existingSchedule || scheduledAt,
        status: 'ready',
        approval_status: existingRow?.approval_status || 'pending',
        last_synced_at: new Date().toISOString(),
        last_error: null,
      };

      if (!existingRow) {
        await supabaseRest('pinterest_automation', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(payload),
        });

        if (imageIndex === 0) {
          const admins = await supabaseRest('admin_users?select=id');
          for (const admin of admins || []) {
            const createdNotifications = await supabaseRest('notifications', {
              method: 'POST',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({
                user_id: admin.id,
                type: 'pinterest_approval_required',
                payload: {
                  listing_id: listingId,
                  title,
                  image_count: imageCount,
                  message: `Yeni Etsy ürünü Pinterest kuyruğuna eklendi: ${title}. Yayın serisini başlatmak için onay gerekiyor.`,
                },
              }),
            });
            if (createdNotifications?.[0]?.id) {
              await dispatchPushNotification(createdNotifications[0].id);
            }
          }
        }
      } else {
        await supabaseRest(
          `pinterest_automation?id=eq.${encodeURIComponent(existingRow.id)}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify(payload),
          }
        );
      }
    }
  }

  const queue = await supabaseRest(
    'pinterest_automation?select=*&order=scheduled_at.asc,etsy_listing_id.asc,image_index.asc'
  );

  return { listings, queue: queue || [], pinterestConnected };
}

function isSameIstanbulDay(a, b = new Date()) {
  return istanbulDate(a) === istanbulDate(b);
}

function isDueNow(scheduledAt, now = new Date()) {
  if (!scheduledAt) return false;
  return new Date(scheduledAt).getTime() <= now.getTime() + 5 * 60 * 1000;
}


async function publishNext(queue) {
  const now = new Date();

  const next = (queue || [])
    .filter(
      (item) =>
        item.status === 'ready' &&
        item.approval_status === 'approved' &&
        item.board_id &&
        item.generated_image_url &&
        isDueNow(item.scheduled_at, now)
    )
    .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0];

  if (!next) {
    return { published: 0, skippedReason: 'no_due_pin' };
  }

  try {
    const pin = await pinterestFetch('/pins', {
      method: 'POST',
      body: JSON.stringify({
        board_id: next.board_id,
        title: next.pin_title || next.etsy_title,
        description: next.pin_description || next.etsy_title,
        link: next.etsy_url,
        media_source: {
          source_type: 'image_url',
          url: next.generated_image_url,
          is_standard: true,
        },
      }),
    });

    const nextStatus = Number(next.image_index || 0) + 1 >= Number(next.image_count || 1)
      ? 'completed'
      : 'published';

    await supabaseRest(`pinterest_automation?id=eq.${encodeURIComponent(next.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: nextStatus,
        pin_id: pin?.id || null,
        published_at: new Date().toISOString(),
        completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
        last_error: null,
        attempt_count: Number(next.attempt_count || 0) + 1,
      }),
    });

    // Product cycle completed: create an admin notification record.
    if (nextStatus === 'completed') {
      const admins = await supabaseRest('admin_users?select=id');
      for (const admin of admins || []) {
        const createdNotifications = await supabaseRest('notifications', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            user_id: admin.id,
            type: 'pinterest_product_completed',
            payload: {
              listing_id: next.etsy_listing_id,
              title: next.etsy_title,
              image_count: next.image_count,
              message: `Pinterest görsel serisi tamamlandı: ${next.etsy_title}`,
            },
          }),
        });
        if (createdNotifications?.[0]?.id) {
          await dispatchPushNotification(createdNotifications[0].id);
        }
      }
    }

    return { published: 1, item: next, pinId: pin?.id || null, completed: nextStatus === 'completed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabaseRest(`pinterest_automation?id=eq.${encodeURIComponent(next.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'error',
        last_error: message.slice(0, 1000),
        attempt_count: Number(next.attempt_count || 0) + 1,
      }),
    });
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let actor;
  try {
    actor = await authorize(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    res.status(/Forbidden/i.test(message) ? 403 : 401).json({ error: message });
    return;
  }

  try {
    // Dashboard GET must stay fast: opening the admin page should only read
    // the existing queue. Full Etsy/Pinterest synchronization is expensive and
    // is reserved for cron or an explicit admin refresh action.
    if (req.method === 'GET') {
      const [queue, tokenRows] = await Promise.all([
        supabaseRest('pinterest_automation?select=*&order=scheduled_at.asc,etsy_listing_id.asc,image_index.asc'),
        supabaseRest('pinterest_oauth_tokens?select=id&limit=1'),
      ]);
      const rows = queue || [];
      const latestPublished = rows
        .filter((item) => (item.status === 'published' || item.status === 'completed') && item.published_at)
        .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())[0] || null;
      const next = rows
        .filter((item) => item.status === 'ready' && item.approval_status === 'approved')
        .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0] || null;
      const pendingApproval = rows
        .filter((item) => item.approval_status === 'pending')
        .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime());
      const completed = rows.filter((item) => item.status === 'completed');

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        ok: true,
        pinterestConnected: Boolean(tokenRows?.length),
        etsyListings: new Set(rows.map((item) => item.etsy_listing_id)).size,
        queue: rows,
        next,
        latestPublished,
        pendingApproval,
        completed,
        nextPublishAt: next?.scheduled_at || null,
        cadence: 'Her aktif Etsy ürünü günde 1 görsel — saatlik aralıklarla',
      });
      return;
    }

    // Admin approval actions reuse this endpoint so the Vercel Hobby
    // serverless-function limit is not increased.
    if (req.method === 'POST' && actor.role === 'admin') {
      const body = typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

      if (body.action === 'sync') {
        const result = await syncQueue();
        const latestPublished = (result.queue || [])
          .filter((item) => (item.status === 'published' || item.status === 'completed') && item.published_at)
          .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())[0] || null;
        const next = (result.queue || [])
          .filter((item) => item.status === 'ready' && item.approval_status === 'approved')
          .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0] || null;
        const pendingApproval = (result.queue || []).filter((item) => item.approval_status === 'pending');
        const completed = (result.queue || []).filter((item) => item.status === 'completed');
        res.status(200).json({
          ok: true,
          pinterestConnected: result.pinterestConnected,
          etsyListings: result.listings.length,
          queue: result.queue,
          next,
          latestPublished,
          pendingApproval,
          completed,
          nextPublishAt: next?.scheduled_at || null,
          cadence: 'Her aktif Etsy ürünü günde 1 görsel — saatlik aralıklarla',
        });
        return;
      }

      if (body.action === 'approve' || body.action === 'reject') {
        const ids = Array.isArray(body.ids) ? body.ids : [body.id];
        const cleanIds = ids.filter(Boolean);
        if (!cleanIds.length) {
          res.status(400).json({ error: 'Onay için kayıt seçilmedi.' });
          return;
        }

        const approvalStatus = body.action === 'approve' ? 'approved' : 'rejected';
        for (const id of cleanIds) {
          await supabaseRest(
            `pinterest_automation?id=eq.${encodeURIComponent(id)}`,
            {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({
                approval_status: approvalStatus,
                approved_at: approvalStatus === 'approved' ? new Date().toISOString() : null,
                status: approvalStatus === 'approved' ? 'ready' : 'skipped',
              }),
            }
          );
        }

        res.status(200).json({ ok: true, action: body.action, count: cleanIds.length });
        return;
      }
    }

    if (actor.role !== 'cron') {
      res.status(403).json({ error: 'Otomatik yayın endpointi yalnızca zamanlanmış görev tarafından çalıştırılabilir.' });
      return;
    }

    let publishResult = { published: 0, skippedReason: 'pinterest_disconnected' };
    if (result.pinterestConnected) {
      try {
        publishResult = await publishNext(result.queue);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/OAuth|token|authorization|Pinterest bağlantısı/i.test(message)) throw error;
        publishResult = { published: 0, skippedReason: 'pinterest_disconnected' };
      }
    }

    const refreshedQueue = await supabaseRest(
      'pinterest_automation?select=*&order=scheduled_at.asc,etsy_listing_id.asc,image_index.asc'
    );

    res.status(200).json({
      ok: true,
      etsyListings: result.listings.length,
      queue: refreshedQueue || [],
      pinterestConnected: result.pinterestConnected,
      ...publishResult,
      nextPublishAt:
        (refreshedQueue || [])
          .filter((item) => item.status === 'ready' && item.approval_status === 'approved')
          .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0]?.scheduled_at || null,
      message:
        publishResult.published === 1
          ? 'Pinterest Pin yayınlandı.'
          : 'Bu saatte yayınlanacak uygun Pin yok.',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Pinterest sync failed',
    });
  }
}
