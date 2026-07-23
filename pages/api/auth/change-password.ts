import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { authenticate } from '../../../lib/auth';
import db from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = authenticate(req, res);
    if (!user) return;

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Current password and new password (min 6 chars) are required' });
    }

    const existing = db.users.findById(user.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(oldPassword, existing.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    db.users.update(user.id, { password: bcrypt.hashSync(newPassword, 10) });
    return res.status(200).json({ message: 'Password updated' });
  } catch (err: any) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
