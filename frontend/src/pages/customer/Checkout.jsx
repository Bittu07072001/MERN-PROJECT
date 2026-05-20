import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeIndianRupee,
  CheckCircle2,
  CreditCard,
  Home,
  Landmark,
  Loader2,
  MapPin,
  ShieldCheck,
  Tag,
  WalletCards,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import { useCartStore } from '../../context/stores';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatMoney = (value = 0) => money.format(Math.max(0, Number(value) || 0));

const getItemPrice = (product) => (
  product?.discountPrice > 0 ? product.discountPrice : product?.price || 0
);

const RAZORPAY_MAX_AMOUNT = 500000;
const BOOKING_PERCENTAGE = 0.01;
const MIN_BOOKING_AMOUNT = 1000;

const getOnlineBookingAmount = (value = 0) => {
  const total = Math.max(0, Number(value) || 0);
  if (total <= RAZORPAY_MAX_AMOUNT) return Math.round(total);

  return Math.round(Math.min(
    RAZORPAY_MAX_AMOUNT,
    Math.max(MIN_BOOKING_AMOUNT, total * BOOKING_PERCENTAGE),
  ));
};

export default function Checkout() {
  const { user } = useAuthStore();
  const { cart, fetch, total, clear } = useCartStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [method, setMethod] = useState('razorpay');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);
  const [addr, setAddr] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  useEffect(() => {
    const loadCart = async () => {
      setCartLoading(true);
      await fetch();
      setCartLoading(false);
    };

    loadCart();
  }, [fetch]);

  useEffect(() => {
    setAddr((current) => ({
      ...current,
      name: current.name || user?.name || '',
      phone: current.phone || user?.phone || '',
    }));
  }, [user]);

  const cartItems = cart?.items || [];
  const subtotal = total();
  const serviceFee = subtotal > 500 ? 0 : 50;
  const grand = Math.max(0, subtotal + serviceFee - discount);
  const onlineBookingAmount = getOnlineBookingAmount(grand);

  const validationErrors = useMemo(() => {
    const errors = [];
    if (!addr.name.trim()) errors.push('Full name is required');
    if (!/^[6-9]\d{9}$/.test(addr.phone.trim())) errors.push('Enter a valid 10 digit phone number');
    if (!addr.street.trim()) errors.push('Address is required');
    if (!addr.city.trim()) errors.push('City is required');
    if (!addr.state.trim()) errors.push('State is required');
    if (!/^\d{6}$/.test(addr.pincode.trim())) errors.push('Enter a valid 6 digit pincode');
    return errors;
  }, [addr]);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return toast.error('Enter coupon code');
    if (!subtotal) return toast.error('Add a property before applying a coupon');

    try {
      const { data } = await api.post('/payments/apply-coupon', {
        code: coupon.trim(),
        subtotal,
      });
      setDiscount(data.discount);
      setCouponApplied(data.coupon);
      toast.success(`Coupon applied. You saved ${formatMoney(data.discount)}`);
    } catch (err) {
      setDiscount(0);
      setCouponApplied(null);
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleCouponChange = (value) => {
    setCoupon(value.toUpperCase());
    if (couponApplied) {
      setDiscount(0);
      setCouponApplied(null);
    }
  };

  const handleOrder = async () => {
    if (!cartItems.length) return toast.error('Your cart is empty');
    if (validationErrors.length) return toast.error(validationErrors[0]);

    setLoading(true);
    const items = cartItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));

    try {
      const { data: orderData } = await api.post('/orders', {
        items,
        shippingAddress: addr,
        paymentMethod: method,
        couponCode: couponApplied?.code,
      });

      if (method === 'cod') {
        await clear();
        toast.success('Booking request placed successfully');
        navigate(`/orders/${orderData.order._id}`);
        return;
      }

      const { data: rp } = await api.post('/payments/razorpay/create', {
        orderId: orderData.order._id,
      });
      if (!rp.keyId || !rp.order?.id) {
        throw new Error('Payment gateway returned an incomplete order');
      }

      const options = {
        key: rp.keyId,
        amount: rp.order.amount,
        currency: 'INR',
        name: 'HomeConnect',
        description: `Booking payment #${orderData.order.orderNumber}`,
        order_id: rp.order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              ...response,
              orderId: orderData.order._id,
            });
            await clear();
            toast.success('Payment successful');
            navigate(`/orders/${orderData.order._id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user?.name || addr.name,
          email: user?.email,
          contact: user?.phone || addr.phone,
        },
        theme: { color: '#4f46e5' },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => new window.Razorpay(options).open();
        script.onerror = () => toast.error('Unable to load payment gateway');
        document.body.appendChild(script);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading checkout
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 mx-auto flex items-center justify-center mb-4">
          <Home className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Your cart is empty</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Add a property to continue with checkout.</p>
        <Link to="/properties" className="btn-primary">Browse Properties</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Checkout</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your property booking details before payment.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-5">
          <section className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Contact & Billing Address
            </h2>

            {user?.addresses?.length > 0 && (
              <div className="mb-4 grid gap-2">
                {user.addresses.map((address, index) => (
                  <button
                    key={`${address.street}-${index}`}
                    type="button"
                    onClick={() => setAddr({
                      name: address.name || user.name || '',
                      phone: address.phone || user.phone || '',
                      street: address.street || '',
                      city: address.city || '',
                      state: address.state || '',
                      pincode: address.pincode || '',
                      country: address.country || 'India',
                    })}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-400 text-sm transition-all"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {address.label || `Saved Address ${index + 1}`}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {' '}- {address.street}, {address.city} {address.pincode}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['name', 'Full Name *', 'text'],
                ['phone', 'Phone *', 'tel'],
                ['street', 'Address *', 'text'],
                ['city', 'City *', 'text'],
                ['state', 'State *', 'text'],
                ['pincode', 'Pincode *', 'text'],
              ].map(([key, placeholder, type]) => (
                <input
                  key={key}
                  type={type}
                  value={addr[key]}
                  onChange={(event) => setAddr((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder={placeholder}
                  className={`input text-sm ${key === 'street' ? 'sm:col-span-2' : ''}`}
                  maxLength={key === 'phone' ? 10 : key === 'pincode' ? 6 : undefined}
                />
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Payment Method
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  value: 'razorpay',
                  label: 'Online Payment',
                  icon: WalletCards,
                  desc: 'Cards, UPI, wallets and net banking',
                },
                {
                  value: 'cod',
                  label: 'Pay Later',
                  icon: Landmark,
                  desc: 'Confirm now and pay after seller approval',
                },
              ].map((option) => {
                const Icon = option.icon;
                const active = method === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMethod(option.value)}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        active ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-sm text-gray-900 dark:text-white">{option.label}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.desc}</span>
                      </span>
                    </div>
                    {active && <CheckCircle2 className="w-4 h-4 text-indigo-600 absolute right-4 bottom-4" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              Coupon Code
            </h2>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(event) => handleCouponChange(event.target.value)}
                placeholder="Enter coupon code"
                className="input text-sm flex-1"
              />
              <button type="button" onClick={handleApplyCoupon} className="btn-primary text-sm px-4">
                Apply
              </button>
            </div>
            {couponApplied && (
              <p className="text-green-600 dark:text-green-400 text-sm mt-2 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {couponApplied.description || couponApplied.code} - {formatMoney(discount)} saved
              </p>
            )}
          </section>
        </div>

        <aside className="lg:col-span-2">
          <div className="card p-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black text-lg text-gray-900 dark:text-white">Booking Summary</h2>
              <span className="badge-primary">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item) => {
                const product = item.product;
                if (!product) return null;
                const price = getItemPrice(product);

                return (
                  <div key={item._id} className="flex gap-3 items-center">
                    <img
                      src={product.images?.[0]?.url || 'https://placehold.co/80x80?text=Home'}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {formatMoney(price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Platform fee</span>
                <span className={serviceFee === 0 ? 'text-green-600 font-semibold' : ''}>
                  {serviceFee === 0 ? 'Included' : formatMoney(serviceFee)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-{formatMoney(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{formatMoney(grand)}</span>
              </div>
              {method === 'razorpay' && onlineBookingAmount < grand && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Payable now</span>
                  <span>{formatMoney(onlineBookingAmount)}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-3 flex gap-2 text-xs text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Your payment is processed securely. Property confirmation depends on seller availability.</span>
            </div>

            <button
              type="button"
              onClick={handleOrder}
              disabled={loading}
              className="btn-primary w-full min-h-11"
              title={validationErrors[0] || ''}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : method === 'cod' ? (
                <>
                  <Home className="w-4 h-4" />
                  Confirm Booking
                </>
              ) : (
                <>
                  <BadgeIndianRupee className="w-4 h-4" />
                  Pay {formatMoney(onlineBookingAmount)} Now
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
