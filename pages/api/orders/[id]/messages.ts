import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../../../lib/auth';
import db from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: orderId } = req.query;

    const order = db.orders.findById(orderId as string);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;

      if (user.role !== 'admin' && order.customer_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const messages = db.messages.findByOrder(orderId as string);
      messages.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
      return res.status(200).json(messages);
    }

    if (req.method === 'POST') {
      const user = authenticate(req, res);
      if (!user) return;

      if (user.role !== 'admin' && order.customer_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      const message = {
        id: uuidv4(),
        order_id: orderId as string,
        sender_id: user.id,
        sender_name: user.role === 'admin' ? 'Rider' : 'You',
        sender_role: user.role,
        text: text.trim(),
        created_at: new Date().toISOString(),
      };

      db.messages.insert(message);
      return res.status(201).json(message);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Messages error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
