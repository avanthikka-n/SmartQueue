import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Lock, Mail, ArrowRight, AlertCircle, Monitor, ShieldAlert } from 'lucide-react';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      const user = res.user;

      // Only allow STAFF role through this portal
      if (user.role !== 'STAFF') {
        logout(); // Clear the auth state set by login()
        setError(
          user.role === 'ORGANIZATION_ADMIN' || user.role === 'SUPER_ADMIN'
            ? 'Admin accounts must use the Admin portal at /login.'
            : 'Only staff accounts can log in here.'
        );
        return;
      }

      navigate('/staff/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 font-bold text-2xl mx-auto mb-4">
            SQ
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff Portal Login</h1>
          <p className="text-sm text-slate-400 mt-1">Access your counter and queue management console</p>
        </div>

        {/* Role badge */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-700 text-brand-400 text-xs font-semibold">
            <Monitor className="w-3.5 h-3.5" />
            <span>STAFF ACCESS ONLY</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-700 flex items-start space-x-3 text-red-400 text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@citycare.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Access Staff Console'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Account Creation Notice */}
          <div className="mt-6 pt-6 border-t border-slate-700 text-xs text-slate-400">
            <div className="p-3.5 rounded-xl bg-slate-700/60 border border-slate-600 flex items-start space-x-3 text-slate-300">
              <AlertCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Staff accounts are created by your organization administrator</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  If you are a staff member without credentials, please request your organization admin to register your account from the Staff Management console.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-slate-500">
            Admin?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition">
              Use Admin Login →
            </Link>
          </p>
          <p className="text-sm text-slate-600">
            <Link to="/" className="hover:text-slate-400 transition">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
