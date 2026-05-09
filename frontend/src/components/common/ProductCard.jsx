import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, GitCompare, Play, MapPin, Bed, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCartStore, useWishlistStore, useCompareStore } from '../../context/stores';
import useAuthStore from '../../context/authStore';
import { computeInvestmentScore, scoreColor } from '../../utils/aiScore';

export default function ProductCard({ product, index = 0 }) {
  const { user }                   = useAuthStore();
  const { add }                    = useCartStore();
  const { toggle, isInWishlist }   = useWishlistStore();
  const { add: addCompare, remove: removeCompare, isIn, items: compareItems } = useCompareStore();
  const [adding, setAdding]        = useState(false);
  const [imgLoaded, setImgLoaded]  = useState(false);

  const p        = product;
  const price    = p.discountPrice > 0 ? p.discountPrice : p.price;
  const inWish   = user ? isInWishlist(p._id) : false;
  const inCompare = isIn(p._id);
  const discount  = p.discountPrice > 0 ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
  const hasVideo  = p.videos?.length > 0;
  const aiScore   = computeInvestmentScore(p);
  const locationLabel = typeof p.location === 'string' ? p.location : p.location?.city;

  const handleAddToCart = async e => {
    e.preventDefault();
    if (!user) return toast.error('Please login to add to cart');
    setAdding(true);
    const ok = await add(p._id);
    if (ok) toast.success(`${p.name.slice(0, 20)}… added to cart`);
    else toast.error('Failed to add to cart');
    setAdding(false);
  };

  const handleWishlist = async e => {
    e.preventDefault();
    if (!user) return toast.error('Please login');
    const added = await toggle(p._id);
    toast.success(added ? 'Added to wishlist ❤️' : 'Removed from wishlist');
  };

  const handleCompare = e => {
    e.preventDefault();
    if (inCompare) { removeCompare(p._id); }
    else {
      if (compareItems.length >= 3) { toast.error('Compare up to 3 properties at a time'); return; }
      addCompare(p);
      toast.success('Added to comparison', { icon: '⚖️' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full">
      <Link to={`/products/${p._id}`} className="block h-full">
        <div className="card overflow-hidden h-full flex flex-col hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:-translate-y-1.5 transition-all duration-300">

          {/* Image */}
          <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0" style={{ aspectRatio: '4/3' }}>
            {/* Skeleton loader */}
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={p.images?.[0]?.url || `https://placehold.co/800x600/e2e8f0/94a3b8?text=${encodeURIComponent(p.category || 'Property')}`}
              alt={p.name}
              onLoad={() => setImgLoaded(true)}
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://placehold.co/800x600/e2e8f0/94a3b8?text=${encodeURIComponent(p.category || 'Property')}`;
              }}
              className={`w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top-left badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                  -{discount}% OFF
                </span>
              )}
              {p.isFeatured && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400 text-amber-900 text-[10px] font-bold shadow-sm">
                  ⭐ Featured
                </span>
              )}
              {p.isTrending && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500 text-white text-[10px] font-bold shadow-sm">
                  🔥 Trending
                </span>
              )}
              {p.stock === 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-gray-800/80 text-white text-[10px] font-bold backdrop-blur-sm">
                  Sold Out
                </span>
              )}
            </div>

            {/* Video badge */}
            {hasVideo && (
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
                <Play className="w-2.5 h-2.5 fill-white" />
                {p.videos.length} Video{p.videos.length > 1 ? 's' : ''}
              </div>
            )}

            {/* Action buttons – appear on hover */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
              <button onClick={handleWishlist}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 backdrop-blur-sm ${
                  inWish
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500'
                }`}>
                <Heart className={`w-3.5 h-3.5 ${inWish ? 'fill-white' : ''}`} />
              </button>
              <button onClick={handleCompare}
                title={inCompare ? 'Remove from compare' : 'Add to compare'}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 backdrop-blur-sm ${
                  inCompare
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600'
                }`}>
                <GitCompare className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Comparing indicator */}
            {inCompare && (
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-primary-600/90 backdrop-blur-sm text-white text-[10px] font-bold">
                ✓ Comparing
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            {/* Category & Location */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-wider">
                {p.brand || p.category}
              </span>
              {locationLabel && (
                <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                  <MapPin className="w-2.5 h-2.5" /> {locationLabel}
                </span>
              )}
            </div>

            {/* Name */}
            <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug mb-2.5 flex-1">
              {p.name}
            </h3>

            {/* Rating */}
            {p.ratings?.count > 0 && (
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.round(p.ratings.average) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {p.ratings.average?.toFixed(1)} ({p.ratings.count})
                </span>
              </div>
            )}

            {/* AI Investment Score */}
            {aiScore && (
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg mb-2.5 ${scoreColor(aiScore.color)}`}>
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Score: {aiScore.score}/10</span>
                <span className="opacity-60">·</span>
                <span className="font-medium">{aiScore.label}</span>
              </div>
            )}

            {/* Price & Cart */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800/60">
              <div>
                <div className="font-black text-base text-gray-900 dark:text-white">
                  ₹{price.toLocaleString()}
                </div>
                {discount > 0 && (
                  <div className="text-xs text-gray-400 line-through">₹{p.price.toLocaleString()}</div>
                )}
              </div>

              {p.stock > 0 ? (
                <button onClick={handleAddToCart} disabled={adding}
                  className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 shadow-md hover:shadow-glow">
                  {adding
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <ShoppingCart className="w-4 h-4" />
                  }
                </button>
              ) : (
                <span className="text-xs text-rose-500 font-semibold">Out of stock</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
