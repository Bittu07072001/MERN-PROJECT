import { useState, useEffect } from 'react';
import { Search, Trash2, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';

export default function AdminUsers({ fixedRole = 'customer', title = 'Users', showRoleFilter = false }) {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState(fixedRole || '');
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuthStore();
  const isAdminList = (fixedRole || role) === 'admin';
  const isMainAdmin = currentUser?.role === 'admin' &&
    currentUser?.name?.trim().toLowerCase() === 'project2.0' &&
    currentUser?.email?.trim().toLowerCase() === 'projectchandra420@gmail.com';

  const isMainAdminAccount = (user) => (
    user?.role === 'admin' &&
    user?.name?.trim().toLowerCase() === 'project2.0' &&
    user?.email?.trim().toLowerCase() === 'projectchandra420@gmail.com'
  );

  const hasAdminPortalAccess = (user) => isMainAdminAccount(user) || user?.adminApproved === true;

  const fetch = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      const selectedRole = fixedRole || role;
      if (selectedRole) p.set('role', selectedRole);
      const { data } = await api.get(`/admin/users?${p}`);
      setUsers(data.users);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, role, fixedRole]);

  const handleToggle = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle`);
      setUsers(u => u.map(x => x._id === userId ? data.user : x));
      if (data.user.role === 'admin') {
        toast.success(hasAdminPortalAccess(data.user) ? 'Admin portal access granted' : 'Admin portal access revoked');
      } else {
        toast.success(data.user.isActive ? 'User activated' : 'User deactivated');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const canDeleteUser = (user) => (
    user._id !== currentUser?._id &&
    (!isAdminList || (isMainAdmin && !isMainAdminAccount(user)))
  );

  const canToggleUser = (user) => (
    !isAdminList || (isMainAdmin && user._id !== currentUser?._id && !isMainAdminAccount(user))
  );

  const handleDeleteUser = async (user) => {
    const label = user.role === 'admin' ? 'admin' : 'user';
    if (!window.confirm(`Delete ${label} "${user.name}" permanently?`)) return;

    try {
      await api.delete(`/admin/users/${user._id}`);
      setUsers(u => u.filter(x => x._id !== user._id));
      toast.success(user.role === 'admin' ? 'Admin removed' : 'User removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove user');
    }
  };

  const ROLE_BADGE = { customer: 'bg-blue-100 text-blue-700', seller: 'bg-purple-100 text-purple-700', admin: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{title} ({users.length})</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="input text-sm pl-9 py-2" />
          </div>
          {showRoleFilter && (
            <select value={role} onChange={e => setRole(e.target.value)} className="input text-sm py-2 w-auto">
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Name', 'Email', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td></tr>
              )) : users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">{u.name?.charAt(0).toUpperCase()}</div>
                      <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3"><span className={`badge capitalize text-xs ${ROLE_BADGE[u.role] || ''}`}>{u.role}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.isEmailVerified ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${isAdminList && !hasAdminPortalAccess(u) ? 'bg-amber-100 text-amber-700' : u.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {isAdminList && !hasAdminPortalAccess(u) ? 'Pending' : u.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canToggleUser(u) && (
                        <button onClick={() => handleToggle(u._id)}
                          className={`p-1.5 rounded-lg transition-colors ${(isAdminList ? hasAdminPortalAccess(u) : u.isActive) ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950'}`}
                          title={isAdminList ? (hasAdminPortalAccess(u) ? 'Revoke admin portal access' : 'Grant admin portal access') : (u.isActive ? 'Deactivate user' : 'Activate user')}>
                          {(isAdminList ? hasAdminPortalAccess(u) : u.isActive) ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      )}
                      {canDeleteUser(u) && (
                        <button onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="Delete user">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && users.length === 0 && <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No users found</div>}
        </div>
      </div>
    </div>
  );
}
