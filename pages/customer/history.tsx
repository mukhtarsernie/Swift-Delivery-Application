import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

interface Order {
  id: string;
  pickup_address: string;
  receiver_address: string;
  price: number;
  status: string;
  created_at: string;
}

export default function History() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute role="customer">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Delivery History</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
            <p className="text-gray-400 text-lg">No orders found</p>
            <Link href="/customer/new-delivery" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
              Book a delivery
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/customer/tracking/${order.id}`}
                className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 truncate">
                      {order.pickup_address} → {order.receiver_address}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
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
