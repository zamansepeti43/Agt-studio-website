import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from '../etsy/_lib.js';
import { pinterestFetch, supabaseRest } from './_lib.js';

function isCronAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = String(req.headers.authorization || '');
  return auth === `Bearer ${secret}`;
}

async function authorize(req) {
  if (isCronAuthorized(req)) return 'cron';
  await requireAdminRequest(req);
  return 'admin';
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
    const pinterestBoards = await listPinterestBoards();
    resolvedRules = (rules || []).map((rule) => resolveBoardRule(rule, pinterestBoards));

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
  // Each product advances to its next image every day. A product with 8 images
  // therefore completes its visual cycle after 8 publishing days.
  const now = new Date();
  const today = istanbulDate(now);
  const startHour = 10; // Türkiye saati; adjustable later from Pinterest Manager.
  const slotMinutes = 60;

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

    const publishedCount = (existing || []).filter((item) => item.status === 'published' || item.status === 'completed').length;
    const imageCount = images.length;

    // Keep existing image rows; add/update only missing images.
    for (let imageIndex = 0; imageIndex < imageCount; imageIndex += 1) {
      const sourceImageUrl = images[imageIndex];
      const generatedImageUrl = pinterestImageUrl(listing, title, formatPrice(listing));
      const existingRow = (existing || []).find((item) => Number(item.image_index) === imageIndex);

      if (existingRow?.status === 'published' || existingRow?.status === 'completed') {
        continue;
      }

      // The next unpublished image gets scheduled for the next available day.
      // Future images are kept in the queue but receive their own future date.
      const existingSchedule = existingRow?.scheduled_at;
      const dayOffset = imageIndex + 1;
      const target = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const targetDay = istanbulDate(target);
      const hour = startHour + productIndex;
      const scheduledAt = `${targetDay}T${String(hour).padStart(2, '0')}:00:00+03:00`;

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
        approval_status: 'approved',
        last_synced_at: new Date().toISOString(),
        last_error: null,
      };

      if (!existingRow) {
        await supabaseRest('pinterest_automation', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(payload),
        });
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
        await supabaseRest('notifications', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
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
    const result = await syncQueue();

    // Admin GET only refreshes/synchronizes the queue. It never publishes.
    if (req.method === 'GET') {
      const latestPublished = (result.queue || [])
        .filter((item) => item.status === 'published' && item.published_at)
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0] || null;

      const next = (result.queue || [])
        .filter((item) => item.status === 'ready' && item.approval_status === 'approved')
        .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0] || null;

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        ok: true,
        pinterestConnected: result.pinterestConnected,
        etsyListings: result.listings.length,
        queue: result.queue,
        next,
        latestPublished,
        nextPublishAt: nextPublishAt(latestPublished?.published_at),
        cadence: 'Günde 1 Pin — Etsy ilan sırasına göre',
      });
      return;
    }

    // Only Vercel Cron is allowed to publish automatically.
    if (actor !== 'cron') {
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
      'pinterest_automation?select=*&order=created_at.asc'
    );

    res.status(200).json({
      ok: true,
      etsyListings: result.listings.length,
      queue: refreshedQueue || [],
      pinterestConnected: result.pinterestConnected,
      ...publishResult,
      nextPublishAt: nextPublishAt(
        (refreshedQueue || [])
          .filter((item) => item.status === 'published' && item.published_at)
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0]?.published_at
      ),
      message:
        publishResult.published === 1
          ? 'Günlük Pinterest Pin yayınlandı.'
          : 'Bugünkü Pinterest yayını atlanmadı; kuyruk bir sonraki günlük çalışmayı bekliyor.',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Pinterest sync failed',
    });
  }
}
