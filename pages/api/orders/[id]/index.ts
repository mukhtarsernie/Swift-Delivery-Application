import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../../lib/auth';
import db from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;

      const order = db.orders.findById(id as string);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (user.role !== 'admin' && order.customer_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json(order);
    }

    if (req.method === 'PUT') {
      const user = authenticate(req, res, 'admin');
      if (!user) return;

      const { status } = req.body;
      const validStatuses = ['accepted', 'picked_up', 'in_transit', 'delivered', 'rejected'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const order = db.orders.findById(id as string);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const updated = db.orders.update(id as string, {
        status,
        updated_at: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Order detail error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
