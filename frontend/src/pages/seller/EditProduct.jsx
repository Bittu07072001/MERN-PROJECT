import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import ProductForm from '../../components/common/ProductForm';

export default function EditProduct() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(true);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => setProduct(r.data.product))
      .catch(() => { toast.error('Product not found'); navigate('/seller/products'); })
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (payload) => {
    setLoading(true);
    try {
      await api.put(`/products/${id}`, payload);
      toast.success('Listing updated successfully!');
      navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return null;

  const initial = {
    ...product,
    price:         String(product.price || ''),
    discountPrice: String(product.discountPrice || ''),
    stock:         String(product.stock || ''),
    tags:          (product.tags || []).join(', '),
    images:        product.images || [],
    attributes:    product.attributes || [],
    shippingInfo: {
      freeShipping: product.shippingInfo?.freeShipping || false,
      shippingCost: String(product.shippingInfo?.shippingCost || ''),
      deliveryDays: String(product.shippingInfo?.deliveryDays || ''),
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/seller/products" className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Edit Listing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{product.name}</p>
        </div>
      </div>
      <ProductForm initial={initial} onSubmit={handleSubmit} loading={loading} submitLabel="Update Listing" />
    </div>
  );
}
