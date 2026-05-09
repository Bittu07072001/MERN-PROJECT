import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, Phone, Mail, User, CheckCircle, XCircle, AlertCircle, Loader, ChevronDown, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [updating, setUpdating] = useState(null);
  const [noteOpen, setNoteOpen] = useState(null);
  const [noteText, setNoteText] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/bookings', { params });
      setBookings(data.bookings || []);
    } catch {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(`Booking marked as ${status}.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  const saveNote = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`,
        { status: bookings.find(b => b._id === id)?.status, adminNote: noteText }
      );
      toast.success('Note saved.');
      setNoteOpen(null);
      fetchBookings();
    } catch {
      toast.error('Could not save note.');
    }
  };

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Visit Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage property visit requests</p>
        </div>
        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold px-3 py-1 rounded-full">
          {bookings.length} total
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filter === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
            }`}>
            {s} {s !== 'all' && <span className="opacity-70">({counts[s] || 0})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const img = b.property?.images?.[0]?.url;
            return (
              <div key={b._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="p-4">
                  <div className="flex gap-4">
                    {/* Property image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=P'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><MapPin className="w-5 h-5" /></div>
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <Link to={`/products/${b.property?._id}`} target="_blank"
                            className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1">
                            {b.property?.name?.substring(0, 45)}{b.property?.name?.length > 45 ? '…' : ''}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </Link>
                          <span className="text-xs text-gray-400">{b.property?.category}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>
                          {b.status}
                        </span>
                      </div>

                      {/* Visitor info */}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-indigo-400" />{b.name}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-indigo-400" />{b.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-indigo-400" />{b.email}</span>
                        <span className="flex items-center gap-1">
                          {b.visitType === 'video-call' ? <Video className="w-3 h-3 text-indigo-400" /> : <MapPin className="w-3 h-3 text-indigo-400" />}
                          {b.visitType === 'video-call' ? 'Video Call' : 'Site Visit'}
                        </span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-400" />
                          {new Date(b.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-400" />{b.visitTime}</span>
                      </div>

                      {b.message && (
                        <p className="mt-1.5 text-xs text-gray-400 italic">"{b.message}"</p>
                      )}
                      {b.adminNote && (
                        <p className="mt-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg">
                          Note: {b.adminNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap border-t border-gray-100 dark:border-gray-800 pt-3">
                    {/* Status updater */}
                    <div className="relative flex-1">
                      <select
                        value={b.status}
                        onChange={e => updateStatus(b._id, e.target.value)}
                        disabled={updating === b._id}
                        className="w-full appearance-none text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 pr-8 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50 cursor-pointer">
                        {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Add/edit note */}
                    <button
                      onClick={() => { setNoteOpen(noteOpen === b._id ? null : b._id); setNoteText(b.adminNote || ''); }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2">
                      {b.adminNote ? 'Edit Note' : '+ Add Note'}
                    </button>

                    {updating === b._id && <Loader className="w-4 h-4 animate-spin text-indigo-600" />}
                  </div>

                  {/* Note editor */}
                  {noteOpen === b._id && (
                    <div className="mt-2 flex gap-2">
                      <input value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder="Add a note for the visitor…"
                        className="input flex-1 text-xs" />
                      <button onClick={() => saveNote(b._id)}
                        className="btn-primary text-xs px-3 py-1.5">Save</button>
                      <button onClick={() => setNoteOpen(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
