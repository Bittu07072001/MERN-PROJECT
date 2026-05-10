import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { downloadAtsAdminReport } from '../../utils/atsReportPdf';

export default function AdminAtsReportButton({ user, className = '', onClick }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!user) {
      toast.error('Please login to generate the report');
      return;
    }

    setLoading(true);
    try {
      const [
        dashboardRes,
        overviewRes,
        liveCountsRes,
        usersRes,
        sellersRes,
        adminsRes,
        productsRes,
        ordersRes,
        bookingsRes,
        couponsRes,
        aiLogsRes,
      ] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/overview'),
        api.get('/admin/live-counts'),
        api.get('/admin/users?role=customer&limit=100'),
        api.get('/admin/sellers'),
        api.get('/admin/users?role=admin&limit=50'),
        api.get('/admin/products?limit=100'),
        api.get('/admin/orders?limit=100'),
        api.get('/bookings?limit=100'),
        api.get('/admin/coupons'),
        api.get('/admin/ai-logs?limit=50'),
      ]);

      const read = (result, key, fallback) =>
        result.status === 'fulfilled' ? result.value.data?.[key] ?? fallback : fallback;
      const readData = (result, fallback) =>
        result.status === 'fulfilled' ? result.value.data ?? fallback : fallback;

      downloadAtsAdminReport({
        user,
        dashboard: readData(dashboardRes, null),
        overview: readData(overviewRes, null),
        liveCounts: readData(liveCountsRes, null),
        users: read(usersRes, 'users', []),
        sellers: read(sellersRes, 'sellers', []),
        admins: read(adminsRes, 'users', []),
        products: read(productsRes, 'products', []),
        orders: read(ordersRes, 'orders', []),
        bookings: read(bookingsRes, 'bookings', []),
        coupons: read(couponsRes, 'coupons', []),
        aiLogs: readData(aiLogsRes, { logs: [], total: 0, stats: {} }),
      });

      toast.success('ATS friendly admin report downloaded');
      onClick?.();
    } catch {
      toast.error('Could not generate admin report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      title="Download ATS Friendly Report">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      ATS Friendly Report
    </button>
  );
}
