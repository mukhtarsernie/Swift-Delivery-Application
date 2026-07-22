import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

interface Earnings {
  date: string;
  total_orders: number;
  delivered: number;
  pending: number;
  accepted: number;
  in_progress: number;
  total_earnings: number;
}

interface Order {
  id: string;
  pickup_address: string;
  receiver_address: string;
  price: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders/earnings').then((r) => r.json()),
      fetch('/api/orders').then((r) => r.json()),
    ]).then(([e, o]) => {
      setEarnings(e);
      setOrders(o);
    }).catch((err) => {
      console.error('Dashboard load error:', err);
    }).finally(() => setLoading(false));
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'pending');

  return (
    <ProtectedRoute role="admin">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="text-2xl font-bold text-blue-600">{earnings?.total_orders || 0}</p>
                <p className="text-sm text-gray-500">Today's Orders</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="text-2xl font-bold text-yellow-600">{earnings?.pending || 0}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="text-2xl font-bold text-green-600">{earnings?.delivered || 0}</p>
                <p className="text-sm text-gray-500">Delivered</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="text-2xl font-bold text-purple-600">₦{(earnings?.total_earnings || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Earnings</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">New Orders ({pendingOrders.length})</h2>
              <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
                No pending orders right now
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders?id=${order.id}`} className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{order.pickup_address} → {order.receiver_address}</p>
                        <p className="text-xs text-gray-400 mt-1">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">Pending</span>
                        <p className="text-sm font-semibold mt-1">₦{order.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
