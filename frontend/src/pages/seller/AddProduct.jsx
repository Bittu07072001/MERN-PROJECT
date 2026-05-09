import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import ProductForm from '../../components/common/ProductForm';

export default function AddProduct() {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload) => {
    setLoading(true);
    try {
      await api.post('/products', payload);
      toast.success('Property listed successfully! 🎉');
      navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/seller/products" className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">List New Property</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Fill in the details to list your property</p>
        </div>
      </div>
      <ProductForm onSubmit={handleSubmit} loading={loading} submitLabel="List Property" />
    </div>
  );
}
