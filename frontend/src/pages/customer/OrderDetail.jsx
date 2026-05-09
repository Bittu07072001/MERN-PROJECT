import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const STEPS = ['placed','confirmed','processing','shipped','out_for_delivery','delivered'];
const STEP_ICONS = { placed: '📋', confirmed: '✅', processing: '⚙️', shipped: '📦', out_for_delivery: '🚚', delivered: '🎉' };

export default function OrderDetail() {
  const { id }    = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).catch(() => toast.error('Order not found')).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`, { reason: 'Cancelled by customer' });
      setOrder(data.order);
      toast.success('Order cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel'); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return null;

  const currentStep = STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  const canCancel   = ['placed', 'confirmed'].includes(order.orderStatus);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/orders" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">← My Orders</Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling} className="text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-colors font-semibold disabled:opacity-50">
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Order Progress</h2>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="absolute top-5 left-5 h-0.5 bg-indigo-500 transition-all duration-700"
              style={{ width: currentStep >= 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : '0%' }} />
            <div className="relative flex justify-between">
              {STEPS.map((step, i) => {
                const done = i <= currentStep;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all z-10 ${done ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                      {STEP_ICONS[step]}
                    </div>
                    <span className={`text-xs text-center capitalize leading-tight ${done ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {order.trackingNumber && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-sm">
              <span className="font-semibold text-blue-700 dark:text-blue-300">Tracking: </span>
              <span className="text-blue-600 dark:text-blue-400">{order.trackingNumber} ({order.courier})</span>
            </div>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="card p-5 border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <XCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">Order Cancelled</p>
              <p className="text-sm">{order.statusHistory?.at(-1)?.message || 'This order has been cancelled'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Items Ordered</h2>
        <div className="space-y-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4 items-center">
              <img src={item.image || `https://placehold.co/64x64`} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Qty: {item.quantity} × ₹{(item.discountPrice || item.price).toLocaleString()}</p>
              </div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">₹{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment & Address grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Payment</h2>
          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between"><span>Method</span><span className="capitalize font-medium text-gray-900 dark:text-white">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</span></div>
            <div className="flex justify-between"><span>Status</span><span className={`font-semibold capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{order.paymentStatus}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount?.toLocaleString()}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}</span></div>
            <div className="flex justify-between font-black text-base text-gray-900 dark:text-white pt-1 border-t border-gray-100 dark:border-gray-800"><span>Total</span><span>₹{order.total?.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Delivery Address</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p className="font-semibold text-gray-900 dark:text-white">{order.shippingAddress?.name}</p>
            <p>{order.shippingAddress?.phone}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
            <p>{order.shippingAddress?.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
