import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import { useAuth } from '../components/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (newPass !== confirm) { setErr('Passwords do not match'); return; }
    if (newPass.length < 6) { setErr('Min 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Password updated!');
      setOldPass(''); setNewPass(''); setConfirm('');
    } catch (er: any) { setErr(er.message); }
    finally { setLoading(false); }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Account Info</h3>
          <div className="text-sm space-y-2">
            <p><span className="text-gray-400">Name:</span> <strong>{user?.name}</strong></p>
            <p><span className="text-gray-400">Email:</span> <strong>{user?.email}</strong></p>
            <p><span className="text-gray-400">Phone:</span> <strong>{user?.phone}</strong></p>
            <p><span className="text-gray-400">Role:</span> <strong className="text-blue-600 capitalize">{user?.role}</strong></p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Change Password</h3>
          {err && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm">{err}</div>}
          {msg && <div className="bg-green-50 text-green-600 px-3 py-2 rounded-lg mb-4 text-sm">{msg}</div>}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
