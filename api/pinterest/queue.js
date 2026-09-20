import { requireAdminRequest } from '../etsy/_lib.js';
import { supabaseRest } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await requireAdminRequest(req);
    const rows = await supabaseRest(
      'pinterest_automation?select=id,etsy_listing_id,etsy_title,etsy_url,generated_image_url,pin_title,pin_description,board_id,board_name,status,last_error,created_at,last_synced_at&order=created_at.asc&limit=100'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, items: rows || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pinterest queue failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    res.status(status).json({ error: message });
  }
}
