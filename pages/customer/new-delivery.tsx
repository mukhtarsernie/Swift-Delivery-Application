import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../components/AuthContext';

const ZONES = [
  { name:'Kano Municipal (City Center / Sabon Gari / Bompai)', price:1000 },
  { name:'Nassarawa (GRA / Hotoro / Zoo Road)', price:1000 },
  { name:'Tarauni (Sheka / Gyadi-Gyadi / Court Road)', price:1200 },
  { name:'Fagge (Murtala Muhammed Way / Kofar Ruwa)', price:1000 },
  { name:'Gwale (Dandago / Sani Mainagge / Kabuga)', price:1200 },
  { name:'Dala (Kofar Mazugal / Mariri / Dakata)', price:1200 },
  { name:'Ungogo (Yankaba / Jaen / Rijiyar Zaki)', price:1500 },
  { name:'Kumbotso (Zaria Road / Kofar Kabuga / Danbare)', price:1500 }
];

export default function NewDelivery() {
  const { user } = useAuth();
  const [pickupZone, setPickupZone] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [pickup, setPickup] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const router = useRouter();

  const estimatePrice = () => {
    const p = parseInt(pickupZone), d = parseInt(deliveryZone);
    if (isNaN(p) || isNaN(d)) { setError('Select both pickup and delivery zones first'); return; }
    setError('');
    if (p === d) setPrice(ZONES[p].price);
    else setPrice(1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pickup || !receiverAddress || !receiverPhone || !description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_address: pickup,
          pickup_zone: pickupZone,
          delivery_zone: deliveryZone,
          receiver_address: receiverAddress,
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          package_description: description,
          payment_method: paymentMethod,
          sender_phone: senderPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/customer/tracking/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute role="customer">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Book a Delivery</h1>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Zone *</label>
            <select value={pickupZone} onChange={(e) => { setPickupZone(e.target.value); setPrice(null); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
              <option value="">-- Select pickup area --</option>
              {ZONES.map((z,i)=><option key={i} value={i}>{z.name} - ₦{z.price.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address Details *</label>
            <input
              type="text"
              value={pickup}
              onChange={(e) => { setPickup(e.target.value); setPrice(null); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter pickup location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Zone *</label>
            <select value={deliveryZone} onChange={(e) => { setDeliveryZone(e.target.value); setPrice(null); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
              <option value="">-- Select delivery area --</option>
              {ZONES.map((z,i)=><option key={i} value={i}>{z.name} - ₦{z.price.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receiver's Address *</label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => { setReceiverAddress(e.target.value); setPrice(null); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter delivery destination"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receiver's Name</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Receiver's name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receiver's Phone *</label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone (for rider contact) *</label>
            <input
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Your phone number"
            />
            <p className="text-xs text-gray-400 mt-1">Rider will call this number if they can't find the pickup address</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
              rows={3}
              placeholder="Describe the package (size, weight, contents)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex gap-4">
              <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer text-center transition ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </label>
              <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer text-center transition ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="hidden" />
                <span className="text-sm font-medium">Pay Online</span>
              </label>
            </div>
          </div>

          {price !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Estimated Price</p>
              <p className="text-2xl font-bold text-green-700">₦{price.toLocaleString()}</p>
            </div>
          )}

          <button
            type="button"
            onClick={estimatePrice}
            disabled={!pickup || !receiverAddress}
            className="w-full border-2 border-blue-500 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Calculate Price
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </main>
    </ProtectedRoute>
  );
}
