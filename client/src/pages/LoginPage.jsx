import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, Mail, ArrowRight, AlertCircle, Building2, User } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialPortal = searchParams.get('portal') === 'admin' ? 'admin' : 'customer';
  const [portalType, setPortalType] = useState(initialPortal); // 'customer' or 'admin'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login(email.trim(), password);
      const user = res.user;

      // Role-based redirection
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (user.role === 'ORGANIZATION_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-brand-500/20">
              SQ
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {portalType === 'admin' ? 'Organization Admin Login' : 'Customer Sign In'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {portalType === 'admin'
              ? 'Access organization dashboards, counters & queue settings'
              : 'View your booked tokens and live queue status'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setPortalType('customer'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                portalType === 'customer'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => { setPortalType('admin'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                portalType === 'admin'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Organization</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={portalType === 'admin' ? 'admin@organization.com' : 'you@example.com'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 text-sm"
            >
              <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick link for staff operators */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">Service desk operator? </span>
            <Link to="/staff/login" className="text-xs font-bold text-slate-800 hover:text-brand-600 underline">
              Open Staff Portal →
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-slate-600">
          Don't have an account?{' '}
          <Link
            to={`/register${portalType === 'admin' ? '?type=org' : ''}`}
            className="font-bold text-brand-600 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
