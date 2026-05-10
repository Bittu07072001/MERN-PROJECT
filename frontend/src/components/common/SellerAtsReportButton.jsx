import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { downloadAtsSellerReport } from '../../utils/atsReportPdf';

export default function SellerAtsReportButton({ user, className = '', onClick }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!user) {
      toast.error('Please login to generate the report');
      return;
    }

    setLoading(true);
    try {
      const [productsRes, ordersRes, dashboardRes, inventoryRes] = await Promise.allSettled([
        api.get('/seller/products?limit=100'),
        api.get('/seller/orders?limit=100'),
        api.get('/seller/dashboard'),
        api.get('/seller/inventory'),
      ]);

      const read = (result, key, fallback) =>
        result.status === 'fulfilled' ? result.value.data?.[key] ?? fallback : fallback;

      downloadAtsSellerReport({
        user,
        products: read(productsRes, 'products', []),
        orders: read(ordersRes, 'orders', []),
        dashboard: dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : null,
        inventory: inventoryRes.status === 'fulfilled'
          ? {
              lowStock: inventoryRes.value.data?.lowStock || [],
              outOfStock: inventoryRes.value.data?.outOfStock || [],
            }
          : { lowStock: [], outOfStock: [] },
      });

      toast.success('ATS friendly seller report downloaded');
      onClick?.();
    } catch {
      toast.error('Could not generate seller report');
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
