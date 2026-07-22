import { useState, useEffect } from 'react';
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

export default function AdminEarnings() {
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
      console.error('Earnings load error:', err);
    }).finally(() => setLoading(false));
  }, []);

  const delivered = orders.filter((o) => o.status === 'delivered');
  const todayRevenue = delivered
    .filter((o) => o.created_at.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, o) => sum + o.price, 0);
  const totalRevenue = delivered.reduce((sum, o) => sum + o.price, 0);

  return (
    <ProtectedRoute role="admin">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Earnings</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <p className="text-sm text-gray-500">Today's Earnings</p>
                <p className="text-3xl font-bold text-green-600 mt-1">₦{todayRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <p className="text-sm text-gray-500">Deliveries Today</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{earnings?.delivered || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5 mb-8">
              <h2 className="font-semibold text-gray-700 mb-4">Today's Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Total Orders" value={earnings?.total_orders || 0} color="text-blue-600" />
                <StatBox label="Pending" value={earnings?.pending || 0} color="text-yellow-600" />
                <StatBox label="Accepted" value={earnings?.accepted || 0} color="text-blue-600" />
                <StatBox label="In Transit" value={earnings?.in_progress || 0} color="text-orange-600" />
                <StatBox label="Delivered" value={earnings?.delivered || 0} color="text-green-600" />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Delivered Orders</h2>
            {delivered.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
                No delivered orders yet
              </div>
            ) : (
              <div className="space-y-3">
                {delivered.slice(0, 20).map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{order.pickup_address} → {order.receiver_address}</p>
                        <p className="text-xs text-gray-400 mt-1">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">₦{order.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
