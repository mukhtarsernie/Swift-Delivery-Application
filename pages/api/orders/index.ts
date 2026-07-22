import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../../lib/auth';
import db from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const user = authenticate(req, res, 'customer');
      if (!user) return;

      const { pickup_address, receiver_address, receiver_name, receiver_phone, package_description, payment_method, sender_phone } = req.body;

      if (!pickup_address || !receiver_address || !receiver_phone || !package_description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const customer = db.users.findById(user.id);
      const price = calculatePrice(pickup_address, receiver_address);

      const order = {
        id: uuidv4(),
        customer_id: user.id,
        customer_name: customer?.name || '',
        customer_phone: sender_phone || customer?.phone || '',
        pickup_address,
        receiver_address,
        receiver_name: receiver_name || '',
        receiver_phone,
        package_description,
        price,
        payment_method: payment_method || 'cod',
        payment_status: payment_method === 'online' ? 'paid' : 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.orders.insert(order);
      return res.status(201).json(order);
    }

    if (req.method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;

      let orders;
      if (user.role === 'admin') {
        orders = db.orders.findAll();
      } else {
        orders = db.orders.findByCustomer(user.id);
      }

      orders.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      return res.status(200).json(orders);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Orders error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}

function calculatePrice(_pickup: string, _receiver: string): number {
  return 1500 + Math.floor(Math.random() * 3500);
}
