import { requireAdminRequest } from '../etsy/_lib.js';
import syncHandler from './sync.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await requireAdminRequest(req);

    if (!process.env.CRON_SECRET) {
      throw new Error('CRON_SECRET Vercel ortam değişkeni eksik.');
    }

    const internalReq = {
      ...req,
      method: 'POST',
      headers: {
        ...(req.headers || {}),
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    };

    return await syncHandler(internalReq, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pinterest sync failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    if (!res.headersSent) res.status(status).json({ error: message });
  }
}
