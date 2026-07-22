import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/auth';
import db from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = authenticate(req, res, 'admin');
    if (!user) return;

    const orders = db.orders.findAll();
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = orders.filter((o: any) => o.created_at && o.created_at.startsWith(today));
    const deliveredToday = todayOrders.filter((o: any) => o.status === 'delivered');
    const totalEarnings = deliveredToday.reduce((sum: number, o: any) => sum + (o.price || 0), 0);

    return res.status(200).json({
      date: today,
      total_orders: todayOrders.length,
      delivered: deliveredToday.length,
      pending: todayOrders.filter((o: any) => o.status === 'pending').length,
      accepted: todayOrders.filter((o: any) => o.status === 'accepted').length,
      in_progress: todayOrders.filter((o: any) =>
        o.status && ['picked_up', 'in_transit'].includes(o.status)
      ).length,
      total_earnings: totalEarnings,
    });
  } catch (err: any) {
    console.error('Earnings error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
