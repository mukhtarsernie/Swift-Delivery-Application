import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

interface Order {
  id: string;
  status: string;
  pickup_address: string;
  receiver_address: string;
  price: number;
  created_at: string;
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <ProtectedRoute role="customer">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
          <Link href="/customer/new-delivery" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
            Book a Delivery
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Link href="/customer/history" className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
            <p className="text-3xl font-bold text-blue-600">{loading ? '-' : orders.length}</p>
            <p className="text-gray-500 text-sm mt-1">Recent Orders</p>
          </Link>
          <Link href="/customer/new-delivery" className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
            <div className="text-3xl font-bold text-green-600">+</div>
            <p className="text-gray-500 text-sm mt-1">New Delivery</p>
          </Link>
          <Link href="/customer/history" className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
            <div className="text-3xl font-bold text-purple-600">📋</div>
            <p className="text-gray-500 text-sm mt-1">Order History</p>
          </Link>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Orders</h2>
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-10"></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
            <p className="text-gray-400 text-lg">No orders yet</p>
            <Link href="/customer/new-delivery" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
              Book your first delivery
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/customer/tracking/${order.id}`} className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{order.pickup_address} → {order.receiver_address}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm font-semibold text-gray-700 mt-1">₦{order.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    picked_up: 'bg-purple-100 text-purple-700',
    in_transit: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}
