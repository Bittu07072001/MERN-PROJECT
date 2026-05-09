import { useEffect } from 'react';
import { Bell, CheckCheck, Package, Tag, Star, Settings, CalendarCheck, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifStore } from '../../context/stores';

const TYPE_ICONS = {
  order:     <Package className="w-5 h-5 text-indigo-500" />,
  payment:   <Tag className="w-5 h-5 text-green-500" />,
  promotion: <Tag className="w-5 h-5 text-orange-500" />,
  review:    <Star className="w-5 h-5 text-yellow-500" />,
  system:    <Settings className="w-5 h-5 text-gray-500" />,
  booking:   <CalendarCheck className="w-5 h-5 text-blue-500" />,
};

export default function Notifications() {
  const { notifications, fetch, markRead, markAllRead, unread } = useNotifStore();
  useEffect(() => { fetch(); }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Notifications</h1>
          {unread > 0 && <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No notifications</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={n._id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`card p-4 flex gap-3 cursor-pointer hover:shadow-md transition-all ${!n.isRead ? 'border-l-4 border-indigo-500' : ''}`}>
              <div className="flex-shrink-0 w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                {TYPE_ICONS[n.type] || <Info className="w-5 h-5 text-gray-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {n.title}
                  </p>
                  {!n.isRead && <span className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
