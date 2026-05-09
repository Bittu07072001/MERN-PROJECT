// Wishlist.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlistStore, useCartStore } from '../../context/stores';

export default function Wishlist() {
  const { wishlist, fetch, toggle } = useWishlistStore();
  const { add } = useCartStore();
  useEffect(() => { fetch(); }, []);

  const products = wishlist?.products || [];

  if (!products.length) return (
    <div className="text-center py-24">
      <div className="text-7xl mb-4">❤️</div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Wishlist is empty</h2>
      <Link to="/products" className="btn-primary mt-4 inline-block">Browse Products</Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Wishlist ({products.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => {
          if (!p || !p._id) return null;
          const price = p.discountPrice > 0 ? p.discountPrice : p.price;
          return (
            <div key={p._id} className="card overflow-hidden group">
              <Link to={`/products/${p._id}`} className="block relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img src={p.images?.[0]?.url || `https://placehold.co/200x200`} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </Link>
              <div className="p-3">
                <Link to={`/products/${p._id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 line-clamp-2">{p.name}</Link>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-1">₹{price?.toLocaleString()}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={async () => { const ok = await add(p._id); if (ok) toast.success('Added to cart!'); }} className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                  <button onClick={async () => { await toggle(p._id); toast.success('Removed from wishlist'); }} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
