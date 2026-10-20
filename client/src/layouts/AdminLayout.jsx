import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Sliders,
  Monitor,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Facilities', path: '/admin/facilities', icon: MapPin },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'Services', path: '/admin/services', icon: Sliders },
    { label: 'Counters', path: '/admin/counters', icon: Monitor },
    { label: 'Staff Accounts', path: '/admin/staff', icon: Users },
    { label: 'Appointments', path: '/admin/appointments', icon: Calendar },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Feedback', path: '/admin/feedback', icon: MessageSquare }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              SQ
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-none">SmartQueue</h2>
              <span className="text-xs text-brand-400 font-medium">Org Admin Portal</span>
            </div>
          </div>
          {user?.organizationId && (
            <div className="mt-4 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-200 truncate">
                {user.organizationId.name || 'Organization'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-brand-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Badge */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Organization Console</h1>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Live</span>
            </span>
          </div>
        </header>

        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
