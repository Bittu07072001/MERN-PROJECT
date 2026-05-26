// Cart.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../context/stores';

export default function Cart() {
  const { cart, fetch, remove, total } = useCartStore();
  const navigate = useNavigate();
  useEffect(() => { fetch(); }, []);

  const items = cart?.items || [];
  const subtotal = total();
  const shipping = subtotal > 500 ? 0 : 50;
  const grand = subtotal + shipping;

  if (!items.length) return (
    <div className="text-center py-24">
      <div className="text-7xl mb-4">🛒</div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Browse properties and add them to your enquiry cart</p>
      <Link to="/products" className="btn-primary inline-flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Browse Properties</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Shopping Cart ({items.length})</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {items.map(item => {
              const p = item.product;
              if (!p) return null;
              const price = p.discountPrice > 0 ? p.discountPrice : p.price;
              return (
                <motion.div key={item._id} layout exit={{ opacity: 0, height: 0 }} className="card p-4 flex gap-4 items-start">
                  <Link to={`/products/${p._id}`} className="flex-shrink-0">
                    <img src={p.images?.[0]?.url || `https://placehold.co/80x80`} alt={p.name} className="w-20 h-20 rounded-xl object-cover bg-gray-100 dark:bg-gray-800" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${p._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 text-sm line-clamp-2">{p.name}</Link>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">₹{price.toLocaleString()}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Quantity: 1
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-white">₹{price.toLocaleString()}</span>
                        <button onClick={() => remove(p._id)} className="text-red-500 hover:text-red-700 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit sticky top-24 space-y-4">
          <h2 className="font-black text-lg text-gray-900 dark:text-white">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal ({items.length} property)</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            {shipping === 0 && <p className="text-xs text-green-600 dark:text-green-400">🎉 No processing fee applied!</p>}
            {shipping > 0 && <p className="text-xs text-gray-400">Add ₹{(500 - subtotal).toLocaleString()} more to waive the processing fee</p>}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between font-black text-base text-gray-900 dark:text-white">
              <span>Total</span><span>₹{grand.toLocaleString()}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2">
            Proceed to EMI Checkout <ArrowRight className="w-4 h-4" />
          </button>
          <Link to="/products" className="btn-secondary w-full text-sm text-center block">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
