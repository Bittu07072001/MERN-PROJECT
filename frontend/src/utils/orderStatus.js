export const ORDER_STATUSES = [
  'inquiry_received',
  'site_visit_scheduled',
  'booking_confirmed',
  'payment_pending',
  'documents_verification',
  'registered',
  'handover_completed',
  'cancelled',
];

export const ORDER_STATUS_LABELS = {
  inquiry_received: 'inquiry received',
  site_visit_scheduled: 'site visit scheduled',
  booking_confirmed: 'booking confirmed',
  payment_pending: 'payment pending',
  documents_verification: 'documents verification',
  registered: 'registered',
  handover_completed: 'handover completed',
  cancelled: 'cancelled',
};

export const ORDER_STATUS_COLORS = {
  inquiry_received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  site_visit_scheduled: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  booking_confirmed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  payment_pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  documents_verification: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  registered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  handover_completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const LEGACY_ORDER_STATUS_LABELS = {
  placed: 'inquiry received',
  confirmed: 'booking confirmed',
  processing: 'documents verification',
  shipped: 'registered',
  out_for_delivery: 'handover completed',
  delivered: 'handover completed',
  returned: 'cancelled',
};

export const LEGACY_TO_ORDER_STATUS = {
  placed: 'inquiry_received',
  confirmed: 'booking_confirmed',
  processing: 'documents_verification',
  shipped: 'registered',
  out_for_delivery: 'handover_completed',
  delivered: 'handover_completed',
  returned: 'cancelled',
};

export const normalizeOrderStatus = (status) => LEGACY_TO_ORDER_STATUS[status] || status;

export const formatOrderStatus = (status) => (
  ORDER_STATUS_LABELS[status] || LEGACY_ORDER_STATUS_LABELS[status] || status?.replace(/_/g, ' ') || 'unknown'
);

export const getOrderStatusColor = (status) => (
  ORDER_STATUS_COLORS[normalizeOrderStatus(status)] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
);
