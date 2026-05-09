import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Video, CheckCircle, XCircle, AlertCircle, Loader, Phone, Mail, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          icon: <XCircle className="w-3.5 h-3.5" /> },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',      icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(data.bookings || []);
    } catch {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    try {
      await api.patch(`/bookings/${id}/cancel`, {});
      toast.success('Booking cancelled.');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel booking.');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader className="w-6 h-6 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your scheduled site visits and video calls</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No bookings yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Browse properties and schedule a visit</p>
          <Link to="/products" className="btn-primary mt-5 inline-flex">Browse Properties</Link>
        </div>
      ) : (
        <AnimatePresence>
          {bookings.map((b, i) => {
            const st = STATUS[b.status] || STATUS.pending;
            const img = b.property?.images?.[0]?.url;
            return (
              <motion.div key={b._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="flex gap-4 p-4">
                  {/* Property thumbnail */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {img ? (
                      <img src={img} alt={b.property?.name} className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/200x200/e2e8f0/64748b?text=Property'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/products/${b.property?._id}`}
                          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 flex items-center gap-1">
                          {b.property?.name}
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                        </Link>
                        <span className="text-xs text-gray-400">{b.property?.category}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        {b.visitType === 'video-call' ? <Video className="w-3.5 h-3.5 text-indigo-400" /> : <MapPin className="w-3.5 h-3.5 text-indigo-400" />}
                        {b.visitType === 'video-call' ? 'Video Call' : 'Site Visit'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(b.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {b.visitTime}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.email}</span>
                    </div>

                    {b.message && (
                      <p className="mt-1.5 text-xs text-gray-400 italic line-clamp-1">"{b.message}"</p>
                    )}

                    {b.adminNote && (
                      <p className="mt-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">
                        Note from team: {b.adminNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                {['pending', 'confirmed'].includes(b.status) && (
                  <div className="px-4 pb-4 flex justify-end">
                    <button
                      onClick={() => handleCancel(b._id)}
                      disabled={cancelling === b._id}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50">
                      {cancelling === b._id ? 'Cancelling…' : 'Cancel Booking'}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
