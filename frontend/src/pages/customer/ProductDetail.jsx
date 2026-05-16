// ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Shield, ChevronLeft, ChevronRight, Package, Minus, Plus, Play, CalendarCheck, TrendingUp, PenLine, ThumbsUp, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useCartStore, useWishlistStore } from '../../context/stores';
import useAuthStore from '../../context/authStore';
import ProductCard from '../../components/common/ProductCard';
import BookingModal from '../../components/common/BookingModal';
import MapView from '../../components/common/MapView';
import { computeInvestmentScore, scoreColor } from '../../utils/aiScore';

export default function ProductDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { add }  = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();

  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [imgIdx,  setImgIdx]    = useState(0);
  const [qty,     setQty]       = useState(1);
  const [adding,  setAdding]    = useState(false);
  const [tab,     setTab]       = useState('description');
  const [activeVideo, setActiveVideo] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

  // Review form state
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', comment: '' });
  const [hoverStar,  setHoverStar]  = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [helpfulLoading, setHelpfulLoading] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        setReviews(data.reviews || []);
        setActiveVideo(0);
        if (data.product.category) {
          const rel = await api.get(`/products?category=${data.product.category}&limit=4`);
          setRelated(rel.data.products.filter(p => p._id !== data.product._id).slice(0, 4));
        }
      } catch { toast.error('Product not found'); navigate('/products'); }
      finally { setLoading(false); }
    };
    fetchProduct();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded" />)}</div>
      </div>
    </div>
  );

  if (!product) return null;

  const price    = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discount = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const inWish   = user ? isInWishlist(product._id) : false;
  const hasVideos = product.videos?.length > 0;
  const formatLocation = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return [value.address, value.city, value.state, value.pincode].filter(Boolean).join(', ');
  };

  const handleAddToCart = async () => {
    if (!user) return toast.error('Please login');
    setAdding(true);
    const ok = await add(product._id, qty);
    if (ok) toast.success(`${qty}x ${product.name.slice(0, 20)}… added to cart!`);
    setAdding(false);
  };

  // ── Review helpers ──────────────────────────────────────────────────────────
  const alreadyReviewed = user ? reviews.some(r => r.user?._id === user._id || r.user === user._id) : false;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (reviewForm.rating === 0) return toast.error('Please select a star rating');
    if (reviewForm.comment.trim().length < 20) return toast.error('Comment must be at least 20 characters');
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', {
        productId: product._id,
        rating:  reviewForm.rating,
        title:   reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      });
      setReviews(prev => [data.review, ...prev]);
      // Update product rating in UI
      const allRatings = [...reviews, data.review];
      const newAvg = allRatings.reduce((a, r) => a + r.rating, 0) / allRatings.length;
      setProduct(p => ({ ...p, ratings: { average: Math.round(newAvg * 10) / 10, count: allRatings.length } }));
      setReviewForm({ rating: 0, title: '', comment: '' });
      toast.success('Review submitted! Thank you.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    }
    setSubmitting(false);
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!user) return toast.error('Please login first');
    setHelpfulLoading(h => ({ ...h, [reviewId]: true }));
    try {
      const { data } = await api.put(`/reviews/${reviewId}/helpful`);
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, helpful: data.helpful, helpfulBy: data.helpfulBy } : r));
    } catch { toast.error('Could not mark review'); }
    setHelpfulLoading(h => ({ ...h, [reviewId]: false }));
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    setAdding(true);
    const ok = await add(product._id, qty);
    setAdding(false);
    if (ok) navigate('/cart');
  };

  const handleWishlist = async () => {
    if (!user) return toast.error('Please login');
    const added = await toggle(product._id);
    toast.success(added ? 'Added to wishlist ❤️' : 'Removed from wishlist');
  };

  const tabs = [
    { key: 'description', label: 'Description' },
    ...(hasVideos ? [{ key: 'videos', label: `Video Tour (${product.videos.length})` }] : []),
    { key: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-indigo-600">Home</Link> /
        <Link to="/products" className="hover:text-indigo-600">Products</Link> /
        <Link to={`/products?category=${product.category}`} className="hover:text-indigo-600">{product.category}</Link> /
        <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main section */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={product.images?.[imgIdx]?.url || `https://placehold.co/800x600/e2e8f0/64748b?text=${encodeURIComponent(product.category || 'Property')}`}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://placehold.co/800x600/e2e8f0/64748b?text=${encodeURIComponent(product.category || 'Property')}`;
              }}
            />
            {product.images?.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + product.images.length) % product.images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-gray-700/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setImgIdx(i => (i + 1) % product.images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-gray-700/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            {discount > 0 && <span className="absolute top-3 left-3 badge bg-rose-500 text-white">{discount}% OFF</span>}
            {hasVideos && (
              <button
                onClick={() => setTab('videos')}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Watch Tour
              </button>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://placehold.co/200x200/e2e8f0/64748b?text=Photo`; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            {product.brand && <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider mb-1">{product.brand}</p>}
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">{product.name}</h1>
          </div>

          {/* Rating */}
          {product.ratings?.count > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(product.ratings?.average ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{product.ratings.average}</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">({product.ratings.count} reviews)</span>
            </div>
          )}

          {/* AI Investment Score */}
          {(() => {
            const s = computeInvestmentScore(product);
            if (!s) return null;
            const barWidth = `${s.score * 10}%`;
            return (
              <div className={`rounded-2xl p-4 border ${scoreColor(s.color)} border-current/20`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> AI Investment Score
                  </span>
                  <span className="text-lg font-black">{s.score}/10 · {s.label}</span>
                </div>
                <div className="h-2 bg-current/20 rounded-full overflow-hidden">
                  <div className="h-full bg-current rounded-full transition-all" style={{ width: barWidth }} />
                </div>
                <p className="text-xs mt-1.5 opacity-75">Based on location, demand, price zone & amenities</p>
              </div>
            );
          })()}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-gray-900 dark:text-white">₹{price.toLocaleString()}</span>
            {discount > 0 && <>
              <span className="text-xl text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
              <span className="badge bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Save ₹{(product.price - price).toLocaleString()}</span>
            </>}
          </div>

          {/* Stock */}
          <div className={`flex items-center gap-2 text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </div>

          {/* Short description */}
          {product.shortDescription && <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{product.shortDescription}</p>}

          {/* Attributes */}
          {product.attributes?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.attributes.map((attr, i) => (
                <span key={i} className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs py-1">
                  <span className="font-semibold">{attr.key}:</span> {attr.value}
                </span>
              ))}
            </div>
          )}

          {/* Video Tour quick-link */}
          {hasVideos && (
            <button
              onClick={() => setTab('videos')}
              className="w-full flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
            >
              <span className="w-9 h-9 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Video Tour Available</p>
                <p className="text-xs text-rose-500 dark:text-rose-400">{product.videos.length} walkthrough video{product.videos.length > 1 ? 's' : ''} — click to watch</p>
              </div>
            </button>
          )}

          {/* Quantity */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Qty:</span>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-bold text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-700 min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3">
            {product.stock > 0 ? (
              <>
                <button onClick={handleAddToCart} disabled={adding} className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm">
                  {adding ? <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} disabled={adding} className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                  Buy Now
                </button>
              </>
            ) : (
              <button disabled className="flex-1 btn-secondary opacity-50 cursor-not-allowed">Out of Stock</button>
            )}
            <button onClick={handleWishlist}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${inWish ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-rose-300 hover:text-rose-500'}`}>
              <Heart className={`w-5 h-5 ${inWish ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Schedule a Visit */}
          <button
            onClick={() => {
              if (!user) { toast.error('Please log in to schedule a visit.'); return; }
              setShowBooking(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all">
            <CalendarCheck className="w-4 h-4" />
            Schedule a Visit
          </button>

          {/* Info chips */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Secure payment</span>
            </div>
          </div>

          {/* Seller info + Chat with Seller */}
          {product.seller && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                {product.seller.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sold by</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.seller.name}</p>
              </div>
              {user && user._id !== product.seller._id && (
                <button
                  onClick={() => navigate(`/chat/${product.seller._id}`)}
                  className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap ${tab === t.key ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.key === 'videos' && <Play className="w-3.5 h-3.5 inline mr-1 mb-0.5" />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {tab === 'description' && (
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          )}

          {tab === 'videos' && hasVideos && (
            <div className="space-y-6">
              {/* Active video player */}
              <motion.div
                key={activeVideo}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-full rounded-2xl overflow-hidden bg-black shadow-xl"
                style={{ paddingTop: '56.25%' }}
              >
                <iframe
                  src={`${product.videos[activeVideo].url}?rel=0&modestbranding=1&autoplay=0`}
                  title={product.videos[activeVideo].title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </motion.div>

              {/* Active video title */}
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {product.videos[activeVideo].title}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Video {activeVideo + 1} of {product.videos.length}
                  </p>
                </div>
              </div>

              {/* Video playlist (if more than 1) */}
              {product.videos.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Videos</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {product.videos.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveVideo(i)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          i === activeVideo
                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-700'
                            : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${i === activeVideo ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                          <Play className={`w-3 h-3 ml-0.5 ${i === activeVideo ? 'text-white fill-white' : 'text-gray-500 dark:text-gray-400'}`} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${i === activeVideo ? 'text-rose-700 dark:text-rose-300' : 'text-gray-800 dark:text-gray-200'}`}>
                            {v.title}
                          </p>
                          <p className="text-xs text-gray-400">Video {i + 1}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="space-y-6">

              {/* ── Write a Review ─────────────────────────────────────────── */}
              {user && !alreadyReviewed && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <PenLine className="w-4 h-4 text-indigo-500" /> Write a Review
                  </h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Star picker */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Your Rating *</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button"
                            onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                            onMouseEnter={() => setHoverStar(s)}
                            onMouseLeave={() => setHoverStar(0)}
                            className="transition-transform hover:scale-125 active:scale-110 focus:outline-none">
                            <Star className={`w-8 h-8 transition-colors ${
                              s <= (hoverStar || reviewForm.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          </button>
                        ))}
                        {(hoverStar || reviewForm.rating) > 0 && (
                          <span className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverStar || reviewForm.rating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Review Title (optional)</label>
                      <input
                        value={reviewForm.title}
                        onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Great location and amenities"
                        className="input text-sm py-2 w-full"
                        maxLength={100}
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Your Review *</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        placeholder="Share your experience with this property — location, build quality, amenities, buying process…"
                        rows={4}
                        className="input text-sm py-2 w-full resize-none"
                        maxLength={1000}
                      />
                      <div className="flex justify-between mt-1">
                        <p className={`text-xs ${reviewForm.comment.length < 20 ? 'text-orange-500' : 'text-green-500'}`}>
                          {reviewForm.comment.length < 20 ? `${20 - reviewForm.comment.length} more chars needed` : '✓ Minimum length met'}
                        </p>
                        <p className="text-xs text-gray-400">{reviewForm.comment.length}/1000</p>
                      </div>
                    </div>

                    <button type="submit" disabled={submitting || reviewForm.rating === 0 || reviewForm.comment.trim().length < 20}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                        : <><CheckCircle2 className="w-4 h-4" /> Submit Review</>
                      }
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Already reviewed notice */}
              {user && alreadyReviewed && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  You have already reviewed this property. Thank you!
                </div>
              )}

              {/* Login prompt */}
              {!user && (
                <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Log in to share your experience with this property.</p>
                  </div>
                  <Link to="/login" className="btn-primary text-sm py-1.5 px-4 whitespace-nowrap">Log In</Link>
                </div>
              )}

              {/* ── Review list ─────────────────────────────────────────────── */}
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">No reviews yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to review this property!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Rating summary bar */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="text-center flex-shrink-0">
                      <p className="text-4xl font-black text-gray-900 dark:text-white">{product.ratings?.average || 0}</p>
                      <div className="flex justify-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.ratings?.average || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="w-3 text-right">{star}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div className="h-full bg-yellow-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: 0.1 * (5 - star) }} />
                            </div>
                            <span className="w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual review cards */}
                  {reviews.map((r, idx) => {
                    const markedHelpful = user && r.helpfulBy?.includes(user._id);
                    const initials = r.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                    const avatarColors = ['bg-indigo-100 text-indigo-700','bg-rose-100 text-rose-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-purple-100 text-purple-700'];
                    const avatarColor = avatarColors[idx % avatarColors.length];
                    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                    return (
                      <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                        className="card p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 ${avatarColor} dark:bg-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.user?.name || 'Anonymous'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                  ))}
                                </div>
                                {dateStr && <span className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</span>}
                              </div>
                            </div>
                          </div>
                          {r.isVerifiedPurchase && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>

                        {r.title && (
                          <p className="font-bold text-sm text-gray-900 dark:text-white mt-3">{r.title}</p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{r.comment}</p>

                        {/* Helpful */}
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <span className="text-xs text-gray-400 dark:text-gray-500">Was this helpful?</span>
                          <button onClick={() => handleMarkHelpful(r._id)} disabled={helpfulLoading[r._id]}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                              markedHelpful
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}>
                            {helpfulLoading[r._id]
                              ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              : <ThumbsUp className={`w-3 h-3 ${markedHelpful ? 'fill-current' : ''}`} />
                            }
                            <span>Yes{r.helpful > 0 ? ` (${r.helpful})` : ''}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Google Maps Location */}
      {(product.location || product.address || product.attributes?.find(a => /location|address|city/i.test(a.key))) && (() => {
        const locationAttr = product.attributes?.find(a => /location|address|city/i.test(a.key));
        const address = formatLocation(product.location) || formatLocation(product.address) || locationAttr?.value || product.name;
        return (
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📍</span> Property Location
            </h2>
            <MapView address={address} location={product.location} propertyName={product.name} className="shadow-sm" />
          </div>
        );
      })()}

      {/* AI Smart Picks */}
      {related.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">AI Smart Picks</h2>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Similar properties
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          product={product}
          user={user}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
