import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navbar from '../../../components/Navbar';
import ChatBox from '../../../components/ChatBox';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { useNotification, playSound } from '../../../components/useNotification';

const LiveMap = dynamic(() => import('../../../components/LiveMap'), { ssr: false });

interface Order {
  id: string;
  pickup_address: string;
  receiver_address: string;
  receiver_name: string;
  receiver_phone: string;
  package_description: string;
  price: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', idx: 0 },
  { key: 'accepted', label: 'Accepted', idx: 1 },
  { key: 'picked_up', label: 'Package Picked Up', idx: 2 },
  { key: 'in_transit', label: 'In Transit', idx: 3 },
  { key: 'delivered', label: 'Delivered', idx: 4 },
];

export default function Tracking() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const notify = useNotification();
  const prevStatusRef = useRef('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject('Order not found')))
      .then((data) => {
        setOrder(data);
        prevStatusRef.current = data.status;
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) return;
        const data: Order = await res.json();
        if (data.status !== prevStatusRef.current && prevStatusRef.current) {
          const labels: Record<string, string> = {
            accepted: 'Your order has been accepted!', picked_up: 'Package picked up!',
            in_transit: 'Rider is on the way!', delivered: 'Package delivered!', rejected: 'Order was rejected'
          };
          const msg = labels[data.status] || `Status: ${data.status}`;
          notify('Delivery Update', msg);
          playSound();
        }
        prevStatusRef.current = data.status;
        setOrder(data);
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [id, notify]);

  const currentStepIdx = order
    ? (order.status === 'rejected' ? -1 : STATUS_STEPS.findIndex((s) => s.key === order.status))
    : -1;

  return (
    <ProtectedRoute role="customer">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">{error}</div>
        ) : order ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-800">Order #{order.id.slice(0, 8)}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {order.status === 'rejected' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600 font-medium">This order has been rejected</p>
                  <button onClick={() => router.push('/customer/new-delivery')} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Book New Delivery
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step.key} className="relative flex items-start gap-4 py-3">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i <= currentStepIdx ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                        {i <= currentStepIdx ? '✓' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${i <= currentStepIdx ? 'text-blue-700' : 'text-gray-400'}`}>{step.label}</p>
                        {i === currentStepIdx && i < 4 && (
                          <p className="text-xs text-blue-500 mt-1">In progress...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Delivery Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup</span>
                  <span className="font-medium text-gray-800">{order.pickup_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Destination</span>
                  <span className="font-medium text-gray-800">{order.receiver_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Receiver</span>
                  <span className="font-medium text-gray-800">{order.receiver_name || 'N/A'} ({order.receiver_phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Package</span>
                  <span className="font-medium text-gray-800">{order.package_description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-medium text-gray-800">
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'} - {order.payment_status}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="font-bold text-blue-600 text-lg">₦{order.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {order.status !== 'rejected' && order.status !== 'delivered' && order.status !== 'pending' && (
              <ErrorBoundary>
                <LiveMap orderId={order.id} />
              </ErrorBoundary>
            )}

            {order.status !== 'rejected' && order.status !== 'delivered' && (
              <ErrorBoundary>
                <ChatBox orderId={order.id} role="customer" />
              </ErrorBoundary>
            )}
          </div>
        ) : null}
      </main>
    </ProtectedRoute>
  );
}

function statusBadge(status: string): string {
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
