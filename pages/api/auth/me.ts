import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = authenticate(req, res);
    if (!user) return;

    return res.status(200).json(user);
  } catch (err: any) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
