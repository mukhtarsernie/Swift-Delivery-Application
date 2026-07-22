import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../../lib/auth';
import db from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: orderId } = req.query;

    if (req.method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;

      const order = db.orders.findById(orderId as string);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (user.role !== 'admin' && order.customer_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const location = order.rider_location || null;
      return res.status(200).json({ location, pickup: order.pickup_address, delivery: order.receiver_address });
    }

    if (req.method === 'PUT') {
      const user = authenticate(req, res, 'admin');
      if (!user) return;

      const { latitude, longitude } = req.body;
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const order = db.orders.findById(orderId as string);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const updated = db.orders.update(orderId as string, {
        rider_location: { latitude, longitude, updated_at: new Date().toISOString() },
      });

      if (!updated || !updated.rider_location) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json(updated.rider_location);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Location error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
