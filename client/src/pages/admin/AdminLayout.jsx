import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menu = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Skills', path: '/admin/skills' },
    { name: 'Sessions', path: '/admin/sessions' },
    { name: 'Reports', path: '/admin/reports' },
    { name: 'Reviews', path: '/admin/reviews' },
    { name: 'Settings', path: '/admin/settings' }
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-72 bg-gradient-to-b from-indigo-700 via-indigo-600 to-purple-600 text-white p-6 shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">SkillSwap</h1>
          <p className="text-sm text-indigo-100 mt-1">Administrator</p>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg font-semibold">{user?.name?.charAt(0)}</div>
          <div>
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-indigo-100">{user?.email}</div>
          </div>
        </div>

        <nav className="space-y-2">
          {menu.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md ${isActive ? 'bg-white/20 ring-1 ring-white/20' : 'hover:bg-white/10'}`}
            >
              <span className="w-3 h-3 bg-white/30 rounded-full" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 flex gap-2">
          <button onClick={() => navigate('/')} className="text-sm bg-white/10 px-3 py-2 rounded">Back</button>
          <button onClick={handleLogout} className="text-sm bg-red-500 px-3 py-2 rounded">Logout</button>
        </div>
      </aside>

      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">{user?.name}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
