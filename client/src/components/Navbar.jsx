import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Menu, X, LogOut, LayoutDashboard, Building2, User, Monitor, ChevronRight } from 'lucide-react';

export default function Navbar({ showApiStatus = false, apiOnline = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZATION_ADMIN') return '/admin/dashboard';
    if (user.role === 'STAFF') return '/staff/dashboard';
    return '/customer/dashboard';
  };

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'ORGANIZATION_ADMIN':
      case 'SUPER_ADMIN':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'STAFF':
        return { label: 'Staff', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      default:
        return { label: 'Customer', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-xl shadow-sm transition group-hover:bg-brand-700">
            SQ
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Smart<span className="text-brand-600">Queue</span>
            </span>
            <span className="text-xs text-slate-500 block -mt-1 font-medium">Token Management</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-3">
          {showApiStatus && (
            <div className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 mr-2">
              <span className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span className="text-slate-600">API:</span>
              <span className="font-semibold text-slate-800">{apiOnline ? 'Online' : 'Offline'}</span>
            </div>
          )}

          <Link
            to="/organizations"
            className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition px-3 py-1.5"
          >
            Facilities
          </Link>

          {user ? (
            // Logged In Controls
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
              {roleBadge && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              )}

              <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]" title={user.name}>
                {user.name}
              </span>

              <Link
                to={getDashboardPath()}
                className="flex items-center space-x-1.5 text-sm font-semibold px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg transition border border-brand-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm font-semibold text-slate-600 hover:text-rose-600 transition px-2.5 py-1.5"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            // Logged Out Controls
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition px-3 py-1.5"
              >
                Customer Login
              </Link>

              <Link
                to="/staff/login"
                className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition px-3 py-1.5"
              >
                Staff Login
              </Link>

              <Link
                to="/login?portal=admin"
                className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition px-3 py-1.5 hidden lg:block"
              >
                Org Login
              </Link>

              <Link
                to="/register"
                className="text-sm font-semibold px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition shadow-sm ml-2"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          {user && roleBadge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link
            to="/organizations"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-brand-600 py-1"
          >
            Facilities
          </Link>

          {user ? (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium">
                Signed in as <span className="font-semibold text-slate-800">{user.name}</span> ({user.email})
              </div>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-sm font-semibold text-brand-600 hover:text-brand-700 py-1"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-2 text-sm font-semibold text-rose-600 hover:text-rose-700 py-1 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-brand-600 py-1"
              >
                Customer Login
              </Link>
              <Link
                to="/staff/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-brand-600 py-1"
              >
                Staff Login
              </Link>
              <Link
                to="/login?portal=admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-brand-600 py-1"
              >
                Organization Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-sm font-semibold px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
