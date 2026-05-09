import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Phone, Mail, User, MessageSquare, MapPin, Video, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM',
];

function getTodayStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getMaxDateStr() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split('T')[0];
}

export default function BookingModal({ product, user, onClose }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked]   = useState(false);

  const [form, setForm] = useState({
    visitType: 'site-visit',
    visitDate: '',
    visitTime: '',
    name:  user?.name  || '',
    phone: user?.phone || '',
    email: user?.email || '',
    message: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canStep1 = form.visitType && form.visitDate && form.visitTime;
  const canStep2 = form.name && form.phone && form.email;

  const handleSubmit = async () => {
    if (!canStep2) return;
    setLoading(true);
    try {
      await api.post('/bookings', {
        property:  product._id,
        name:      form.name,
        phone:     form.phone,
        email:     form.email,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        visitType: form.visitType,
        message:   form.message,
      });
      setBooked(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Schedule a Visit</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{product.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            {/* Success State */}
            {booked ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Visit Scheduled!</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Your {form.visitType === 'video-call' ? 'video call' : 'site visit'} is booked for<br />
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {new Date(form.visitDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at {form.visitTime}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">We'll confirm via email shortly. You can manage your visits from My Bookings.</p>
                </div>
                <button onClick={onClose} className="btn-primary w-full">Done</button>
              </motion.div>
            ) : (
              <>
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-5">
                  {[1, 2].map(s => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        s < step ? 'bg-green-500 text-white' : s === step ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>{s < step ? '✓' : s}</div>
                      <span className={`text-xs font-medium ${s === step ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {s === 1 ? 'Date & Time' : 'Your Details'}
                      </span>
                      {s < 2 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />}
                    </div>
                  ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    {/* Visit Type */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Visit Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'site-visit', icon: <MapPin className="w-4 h-4" />, label: 'Site Visit', sub: 'Visit in person' },
                          { value: 'video-call', icon: <Video className="w-4 h-4" />, label: 'Video Call', sub: 'Virtual tour' },
                        ].map(opt => (
                          <button key={opt.value} onClick={() => set('visitType', opt.value)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                              form.visitType === opt.value
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}>
                            <div className={`${form.visitType === opt.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                              {opt.icon}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${form.visitType === opt.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>{opt.label}</p>
                              <p className="text-xs text-gray-400">{opt.sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Preferred Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="date" value={form.visitDate} onChange={e => set('visitDate', e.target.value)}
                          min={getTodayStr()} max={getMaxDateStr()}
                          className="input pl-10 w-full" />
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Preferred Time</label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map(slot => (
                          <button key={slot} onClick={() => set('visitTime', slot)}
                            className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all ${
                              form.visitTime === slot
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
                            }`}>
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => setStep(2)} disabled={!canStep1}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-3 flex items-center gap-3">
                      <div className="text-indigo-600 dark:text-indigo-400">
                        {form.visitType === 'video-call' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                          {form.visitType === 'video-call' ? 'Video Call' : 'Site Visit'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 mx-1">·</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {new Date(form.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {form.visitTime}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input placeholder="Full Name *" value={form.name} onChange={e => set('name', e.target.value)}
                          className="input pl-10 w-full" />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input placeholder="Phone Number *" value={form.phone} onChange={e => set('phone', e.target.value)}
                          type="tel" className="input pl-10 w-full" />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input placeholder="Email Address *" value={form.email} onChange={e => set('email', e.target.value)}
                          type="email" className="input pl-10 w-full" />
                      </div>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea placeholder="Any questions or notes (optional)" value={form.message} onChange={e => set('message', e.target.value)}
                          rows={3} maxLength={500}
                          className="input pl-10 w-full resize-none" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Back
                      </button>
                      <button onClick={handleSubmit} disabled={!canStep2 || loading}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Booking…
                          </span>
                        ) : 'Confirm Booking'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
