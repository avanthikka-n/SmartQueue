import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!token || !user) {
    // Redirect to /staff/login if trying to access a staff route, otherwise /login
    const isStaffRoute = location.pathname.startsWith('/staff/');
    const loginPath = isStaffRoute ? '/staff/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-2">
            Your role (<span className="font-semibold text-slate-700">{user.role}</span>) does not have permission to view this page.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-3">
            <a
              href={
                user.role === 'ORGANIZATION_ADMIN' || user.role === 'SUPER_ADMIN'
                  ? '/admin/dashboard'
                  : user.role === 'STAFF'
                  ? '/staff/dashboard'
                  : '/customer/dashboard'
              }
              className="px-4 py-2 bg-brand-600 text-white font-medium text-sm rounded-xl hover:bg-brand-700 transition"
            >
              Go to Your Dashboard
            </a>
            <a href="/" className="px-4 py-2 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition">
              Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
