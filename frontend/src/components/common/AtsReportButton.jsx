import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { downloadAtsBuyerReport } from '../../utils/atsReportPdf';

export default function AtsReportButton({ user, className = '', onClick, compact = false }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!user) {
      toast.error('Please login to generate the report');
      return;
    }

    setLoading(true);
    try {
      const [wishlistRes, cartRes, ordersRes, bookingsRes, productsRes] = await Promise.allSettled([
        api.get('/wishlist'),
        api.get('/cart'),
        api.get('/orders/my?limit=20'),
        api.get('/bookings/my'),
        api.get('/products?limit=60&sort=-viewCount'),
      ]);

      const read = (result, key, fallback) =>
        result.status === 'fulfilled' ? result.value.data?.[key] ?? fallback : fallback;

      downloadAtsBuyerReport({
        user,
        wishlist: read(wishlistRes, 'wishlist', { products: [] }),
        cart: read(cartRes, 'cart', { items: [] }),
        orders: read(ordersRes, 'orders', []),
        bookings: read(bookingsRes, 'bookings', []),
        products: read(productsRes, 'products', []),
      });

      toast.success('ATS friendly report downloaded');
      onClick?.();
    } catch {
      toast.error('Could not generate report');
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
      {compact ? 'ATS Report' : 'ATS Friendly Report'}
    </button>
  );
}
