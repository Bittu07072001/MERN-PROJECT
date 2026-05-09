import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

export default function DevLogin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const init = useAuthStore(s => s.init);

  useEffect(() => {
    const token = params.get('token');
    const to    = params.get('to') || '/';
    if (token) {
      localStorage.setItem('token', token);
      init().then(() => navigate(to, { replace: true }));
    } else {
      navigate('/', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#080c14]">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
