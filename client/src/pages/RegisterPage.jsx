import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Building2, User, Mail, Phone, Lock, ArrowRight, AlertCircle, MapPin } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'org' ? 'ORGANIZATION_ADMIN' : 'CUSTOMER';
  const [accountType, setAccountType] = useState(defaultType); // CUSTOMER or ORGANIZATION_ADMIN

  // Common user fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Organization-specific fields
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('hospital');
  const [orgAddress, setOrgAddress] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        role: accountType,
        ...(accountType === 'ORGANIZATION_ADMIN' && {
          orgName: orgName.trim(),
          orgType,
          orgAddress: orgAddress.trim()
        })
      };

      const res = await register(payload);
      const user = res.user;

      if (user.role === 'ORGANIZATION_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-brand-500/20">
              SQ
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create Your Account</h1>
          <p className="text-sm text-slate-500 mt-1">Get started with SmartQueue token management</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setAccountType('CUSTOMER'); setError(''); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition ${
                accountType === 'CUSTOMER'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Account
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('ORGANIZATION_ADMIN'); setError(''); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition ${
                accountType === 'ORGANIZATION_ADMIN'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Organization Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Specific Fields */}
            {accountType === 'ORGANIZATION_ADMIN' && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 mb-5">
                <div className="flex items-center space-x-2 text-xs font-bold text-brand-700 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span>Facility / Organization Details</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. CityCare Hospital or Metro National Bank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Facility Type *
                    </label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                    >
                      <option value="hospital">Hospital / Healthcare</option>
                      <option value="clinic">Medical Clinic</option>
                      <option value="bank">Bank / Financial Institution</option>
                      <option value="government">Government Office</option>
                      <option value="education">College / University</option>
                      <option value="hotel">Hotel / Hospitality</option>
                      <option value="salon">Salon / Spa</option>
                      <option value="service_center">Service & Repair Center</option>
                      <option value="other">Other Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Facility Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={orgAddress}
                        onChange={(e) => setOrgAddress(e.target.value)}
                        placeholder="Street, City, Postal Code"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Administrator / Customer Information */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {accountType === 'ORGANIZATION_ADMIN' ? 'Administrator Full Name *' : 'Full Name *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 text-sm"
            >
              <span>{submitting ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
