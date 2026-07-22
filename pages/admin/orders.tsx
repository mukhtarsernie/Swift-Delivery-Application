import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import ChatBox from '../../components/ChatBox';

function LocationUpdater({ orderId }: { orderId: string }) {
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const watchIdRef = useRef<number | null>(null);

  const sendLocation = async (lat: number, lng: number) => {
    try {
      await fetch(`/api/orders/${orderId}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      setMsg(`Live: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setMsg('Failed to send location');
    }
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setMsg('GPS not available on this device');
      return;
    }

    setSharing(true);
    setStatus('active');
    setMsg('Acquiring GPS signal...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocation(latitude, longitude);
      },
      (err) => {
        setStatus('error');
        setSharing(false);
        if (err.code === 1) setMsg('Location access denied. Enable GPS in browser settings.');
        else if (err.code === 2) setMsg('GPS signal unavailable');
        else setMsg('GPS error. Try again.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
    setStatus('idle');
    setMsg('Location sharing stopped');
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="mt-5 pt-4 border-t">
      <p className="text-sm font-medium text-gray-700 mb-2">Rider Location</p>

      <button
        onClick={sharing ? stopSharing : startSharing}
        className={`w-full py-2 rounded-lg text-sm font-medium transition ${
          sharing
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {sharing ? 'Stop Sharing Location' : 'Start Sharing Location'}
      </button>

      {msg && (
        <p className={`text-xs mt-2 ${status === 'error' ? 'text-red-500' : status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
          {status === 'active' && <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />}
          {msg}
        </p>
      )}
    </div>
  );
}

interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
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
}

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const { id } = router.query;
    if (id && orders.length > 0) {
      const order = orders.find((o) => o.id === id) || null;
      setSelected(order);
    }
  }, [router.query.id, orders]);

  const updateStatus = async (orderId: string, status: string) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (updated) {
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          setSelected(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <ProtectedRoute role="admin">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
          <button onClick={fetchOrders} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">No orders</div>
            ) : (
              filtered.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition hover:shadow-md ${selected?.id === order.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{order.pickup_address} → {order.receiver_address}</p>
                      <p className="text-xs text-gray-400 mt-1">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-sm font-semibold mt-1">₦{order.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            {selected ? (
              <div className="bg-white rounded-xl shadow-sm border p-5 sticky top-4">
                <h3 className="font-semibold text-gray-800 mb-4">Order Details</h3>
                <div className="space-y-3 text-sm">
                  <DetailRow label="Order ID" value={`#${selected.id.slice(0, 8)}`} />

                  {selected.customer_phone && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 -mx-1">
                      <p className="text-xs text-blue-500 font-medium mb-1">CALL SENDER IF ADDRESS IS UNCLEAR</p>
                      <p className="font-semibold text-blue-800">{selected.customer_name || 'Customer'}</p>
                      <a href={`tel:${selected.customer_phone}`} className="text-lg font-bold text-blue-600 hover:underline">
                        {selected.customer_phone}
                      </a>
                    </div>
                  )}

                  <DetailRow label="Pickup" value={selected.pickup_address} />
                  <DetailRow label="Receiver Address" value={selected.receiver_address} />
                  <DetailRow label="Receiver Name" value={selected.receiver_name || 'N/A'} />
                  <DetailRow label="Receiver Phone" value={selected.receiver_phone} />
                  <DetailRow label="Package" value={selected.package_description} />
                  <DetailRow label="Payment" value={`${selected.payment_method.toUpperCase()} - ${selected.payment_status}`} />
                  <DetailRow label="Price" value={`₦${selected.price.toLocaleString()}`} />
                  <DetailRow label="Status" value={selected.status.replace(/_/g, ' ')} />
                  <DetailRow label="Date" value={new Date(selected.created_at).toLocaleString()} />
                </div>

                {selected.status !== 'delivered' && selected.status !== 'rejected' && (
                  <div className="mt-5 pt-4 border-t space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {getNextStatuses(selected.status).map((status) => (
                        <button
                          key={status.key}
                          onClick={() => updateStatus(selected.id, status.key)}
                          disabled={statusLoading}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition ${status.color} hover:opacity-90 disabled:opacity-50`}
                        >
                          {statusLoading ? '...' : status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selected.status !== 'pending' && selected.status !== 'delivered' && selected.status !== 'rejected' && (
                  <LocationUpdater orderId={selected.id} />
                )}

                {selected.status !== 'delivered' && selected.status !== 'rejected' && (
                  <div className="mt-5">
                    <ChatBox orderId={selected.id} role="admin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400 text-sm">
                Select an order to view details
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right ml-4">{value}</span>
    </div>
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

function getNextStatuses(status: string): { key: string; label: string; color: string }[] {
  switch (status) {
    case 'pending':
      return [
        { key: 'accepted', label: 'Accept', color: 'bg-blue-600 text-white' },
        { key: 'rejected', label: 'Reject', color: 'bg-red-600 text-white' },
      ];
    case 'accepted':
      return [{ key: 'picked_up', label: 'Package Picked Up', color: 'bg-purple-600 text-white' }];
    case 'picked_up':
      return [{ key: 'in_transit', label: 'In Transit', color: 'bg-orange-600 text-white' }];
    case 'in_transit':
      return [{ key: 'delivered', label: 'Mark Delivered', color: 'bg-green-600 text-white' }];
    default:
      return [];
  }
}
