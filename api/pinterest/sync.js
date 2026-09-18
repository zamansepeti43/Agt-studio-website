import { etsyApiFetch, getEtsyAccessToken } from '../etsy/_lib.js';
import { pinterestFetch, supabaseRest } from './_lib.js';

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = String(req.headers.authorization || '');
  return auth === `Bearer ${secret}`;
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

  const params = new URLSearchParams({
    title,
    src: source,
  });
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

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized. Set CRON_SECRET in Vercel.' });
    return;
  }

  try {
    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
    if (!shop?.shop_id) throw new Error('Etsy shop ID alınamadı.');

    const query = new URLSearchParams({
      state: 'active',
      limit: '100',
      offset: '0',
      sort_on: 'updated',
      includes: 'Images',
    });

    const data = await etsyApiFetch(`/shops/${shop.shop_id}/listings?${query.toString()}`);
    const listings = data?.results || [];
    const rules = await supabaseRest(
      'pinterest_board_rules?select=*&enabled=eq.true&order=priority.asc'
    );

    // Resolve board IDs from Pinterest itself so newly-created boards do not
    // require manually copying IDs into Supabase. If OAuth is not connected,
    // keep the queue usable and resolve them on the next run.
    let resolvedRules = rules || [];
    try {
      const pinterestBoards = await listPinterestBoards();
      resolvedRules = (rules || []).map((rule) => resolveBoardRule(rule, pinterestBoards));

      for (const rule of resolvedRules) {
        const original = (rules || []).find((item) => item.id === rule.id);
        if (rule.board_id && rule.board_id !== original?.board_id) {
          await supabaseRest(
            `pinterest_board_rules?id=eq.${encodeURIComponent(rule.id)}`,
            {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ board_id: rule.board_id, updated_at: new Date().toISOString() }),
            }
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/OAuth|token|authorization|Pinterest bağlantısı/i.test(message)) throw error;
    }

    let published = 0;
    let ready = 0;
    let errors = 0;

    for (const listing of listings) {
      const listingId = Number(listing.listing_id);
      const title = String(listing.title || 'AGT Studio Digital Tool');
      const etsyUrl =
        listing.url || `https://www.etsy.com/listing/${listingId}`;
      const board = chooseBoard(title, resolvedRules);
      const price = formatPrice(listing);
      const generatedImageUrl = pinterestImageUrl(listing, title, price);

      const existing = await supabaseRest(
        `pinterest_automation?select=*&etsy_listing_id=eq.${listingId}&limit=1`
      );

      const row = existing?.[0];

      if (row?.status === 'published' && row.pin_id) {
        await supabaseRest(`pinterest_automation?id=eq.${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            etsy_title: title,
            etsy_url: etsyUrl,
            source_image_url: listing.images?.[0]?.url_760xN || listing.images?.[0]?.url_570xN || null,
            generated_image_url: generatedImageUrl,
            board_id: board?.board_id || row.board_id || null,
            board_name: board?.board_name || row.board_name || null,
            pin_title: title,
            last_synced_at: new Date().toISOString(),
          }),
        });
        continue;
      }

      const payload = {
        etsy_listing_id: listingId,
        etsy_title: title,
        etsy_url: etsyUrl,
        source_image_url:
          listing.images?.[0]?.url_760xN || listing.images?.[0]?.url_570xN || null,
        generated_image_url: generatedImageUrl,
        pin_title: title,
        pin_description: `${title} — AGT Studio digital product on Etsy.`,
        board_id: board?.board_id || null,
        board_name: board?.board_name || null,
        status: 'ready',
        last_synced_at: new Date().toISOString(),
        last_error: null,
      };

      if (!row) {
        await supabaseRest('pinterest_automation', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(payload),
        });
      } else {
        await supabaseRest(`pinterest_automation?id=eq.${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(payload),
        });
      }
      ready += 1;
    }

    // If Pinterest OAuth is not approved/connected yet, stop after preparing the queue.
    let pinterestConnected = true;
    try {
      const queued = await supabaseRest(
        'pinterest_automation?select=*&status=eq.ready&order=created_at.asc&limit=100'
      );

      for (const item of queued || []) {
        // Ürün için pano kuralı tanımlanmadan Pin yayınlama.
        // Kullanıcı eksik panoları oluşturduğunda board rules üzerinden eşleştirilir.
        const boardId = item.board_id;
        if (!boardId || !item.generated_image_url) continue;

        try {
          const pin = await pinterestFetch('/pins', {
            method: 'POST',
            body: JSON.stringify({
              board_id: boardId,
              title: item.pin_title || item.etsy_title,
              description: item.pin_description || item.etsy_title,
              link: item.etsy_url,
              media_source: {
                source_type: 'image_url',
                url: item.generated_image_url,
                is_standard: true,
              },
            }),
          });

          await supabaseRest(`pinterest_automation?id=eq.${encodeURIComponent(item.id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              status: 'published',
              pin_id: pin?.id || null,
              published_at: new Date().toISOString(),
              last_error: null,
              attempt_count: Number(item.attempt_count || 0) + 1,
            }),
          });
          published += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (/OAuth|token|authorization|Pinterest bağlantısı/i.test(message)) {
            pinterestConnected = false;
            break;
          }

          await supabaseRest(`pinterest_automation?id=eq.${encodeURIComponent(item.id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              status: 'error',
              last_error: message.slice(0, 1000),
              attempt_count: Number(item.attempt_count || 0) + 1,
            }),
          });
          errors += 1;
        }
      }
    } catch (error) {
      if (/Pinterest OAuth|bağlantısı/i.test(error instanceof Error ? error.message : '')) {
        pinterestConnected = false;
      } else {
        throw error;
      }
    }

    res.status(200).json({
      ok: true,
      etsyListings: listings.length,
      queued: ready,
      published,
      errors,
      pinterestConnected,
      message: pinterestConnected
        ? 'Etsy → Pinterest sync completed.'
        : 'Etsy products were synchronized to the Pinterest queue. OAuth connection is not ready yet.',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Pinterest sync failed',
    });
  }
}
