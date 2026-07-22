import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { signToken } from '../../../lib/auth';
import db from '../../../lib/db';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existing = db.users.findByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    phone,
    role: 'customer',
    created_at: new Date().toISOString(),
  };

  db.users.insert(user);

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`);

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token,
  });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
