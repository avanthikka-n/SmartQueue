import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';
import {
  Ticket,
  Clock,
  CheckCircle2,
  Building2,
  Plus,
  ArrowRight,
  Users,
  AlertCircle,
  XCircle,
  ExternalLink,
  RotateCcw,
  MapPin,
  Calendar,
  LogOut,
  Bell
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTokens, setActiveTokens] = useState([]);
  const [previousTokens, setPreviousTokens] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [tokensRes, orgsRes] = await Promise.all([
        api.get('/api/tokens/my-tokens'),
        api.get('/api/organizations')
      ]);

      if (tokensRes.data.success) {
        setActiveTokens(tokensRes.data.activeTokens || []);
        setPreviousTokens(tokensRes.data.previousTokens || []);
      }
      if (orgsRes.data.success) {
        setFacilities(orgsRes.data.organizations || []);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up Socket.IO for live queue updates
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on('token_called', handleUpdate);
    socket.on('service_started', handleUpdate);
    socket.on('service_completed', handleUpdate);
    socket.on('token_skipped', handleUpdate);
    socket.on('token_cancelled', handleUpdate);
    socket.on('queue_updated', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleCancelToken = async (tokenId, tokenNumber) => {
    if (!window.confirm(`Are you sure you want to cancel Token ${tokenNumber}?`)) {
      return;
    }

    setCancellingId(tokenId);
    setActionError('');

    try {
      const res = await api.post(`/api/tokens/${tokenId}/cancel`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to cancel token');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRejoinToken = async (pastToken) => {
    try {
      setActionError('');
      const payload = {
        organizationId: pastToken.organizationId?._id || pastToken.organizationId,
        departmentId: pastToken.departmentId?._id || pastToken.departmentId,
        serviceId: pastToken.serviceId?._id || pastToken.serviceId,
        customerName: pastToken.customerName || user?.name,
        customerPhone: pastToken.customerPhone || user?.phone,
        priority: pastToken.priority || 'NORMAL'
      };

      const res = await api.post('/api/tokens', payload);
      if (res.data.success && res.data.token?._id) {
        navigate(`/token/${res.data.token._id}`);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to rejoin queue');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* Welcome & Fast Book Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hello, {user?.name?.split(' ')[0] || 'Customer'}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your active queue tokens and book appointments across registered facilities.
            </p>
          </div>
          <Link
            to="/organizations"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Token</span>
          </Link>
        </div>

        {actionError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Section 1: Active Tokens */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Ticket className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Tokens ({activeTokens.length})</h2>
            </div>
            <button
              onClick={fetchDashboardData}
              className="text-xs font-semibold text-slate-500 hover:text-brand-600 flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200">
              Loading active tokens...
            </div>
          ) : activeTokens.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Active Tokens</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You do not currently have any tokens in waiting or service. Choose a facility to generate your token.
              </p>
              <Link
                to="/organizations"
                className="inline-flex items-center space-x-2 mt-4 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <span>Find a Facility</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeTokens.map((token) => {
                const isCalled = token.status === 'CALLED';
                const isInService = token.status === 'IN_SERVICE';

                return (
                  <div
                    key={token._id}
                    className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition ${
                      isCalled ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Facility Name & Status Pill */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
                            {token.organizationId?.name || 'Facility'}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">
                            {token.serviceId?.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {token.departmentId?.name}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                          isCalled ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          isInService ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {token.status}
                        </span>
                      </div>

                      {/* Called Alert Box if Called */}
                      {isCalled && (
                        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                          <p className="font-bold">🔔 Your token has been called!</p>
                          <p className="mt-0.5">Please proceed to {token.counterId?.name || 'Assigned Counter'}.</p>
                        </div>
                      )}

                      {/* Main Token Display Box */}
                      <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 my-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Token Number</span>
                        <div className="text-4xl font-black text-slate-900 font-mono tracking-tight mt-1">
                          {token.tokenNumber}
                        </div>
                        {token.priority && token.priority !== 'NORMAL' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-md uppercase">
                            {token.priority} Priority
                          </span>
                        )}
                      </div>

                      {/* Queue Stats Row */}
                      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-semibold block text-[10px] uppercase">Queue Position</span>
                          <span className="text-base font-black text-slate-900 mt-0.5 block">
                            {token.status === 'WAITING' ? `#${token.queuePosition || 1} in Line` : 'Serving Now'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {token.peopleAhead !== undefined ? `${token.peopleAhead} people ahead` : ''}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-semibold block text-[10px] uppercase">Est. Wait Time</span>
                          <span className="text-base font-black text-slate-900 mt-0.5 block">
                            ~{token.estimatedWaitTime || 0} mins
                          </span>
                          <span className="text-[10px] text-slate-400 italic">Approximate estimate</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        to={`/token/${token._id}`}
                        className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition text-center"
                      >
                        <span>View Live Ticket</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {token.status === 'WAITING' && (
                        <button
                          onClick={() => handleCancelToken(token._id, token.tokenNumber)}
                          disabled={cancellingId === token._id}
                          className="py-2.5 px-4 border border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
                        >
                          {cancellingId === token._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Explore Registered Facilities */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Available Facilities</h2>
            </div>
            <Link
              to="/organizations"
              className="text-xs font-bold text-brand-600 hover:underline flex items-center space-x-1"
            >
              <span>View All Facilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.slice(0, 3).map((facility) => (
              <div
                key={facility._id}
                onClick={() => navigate(`/select-service?organizationId=${facility._id}`)}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-brand-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white text-slate-700 border border-slate-200">
                      {facility.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition text-sm">
                    {facility.name}
                  </h4>
                  {facility.address && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{facility.address}</span>
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-brand-600">
                  <span>Select Services</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Previous Booking History */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Booking History ({previousTokens.length})</h2>
          </div>

          {previousTokens.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No past token records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Token #</th>
                    <th className="py-3 px-3">Facility</th>
                    <th className="py-3 px-3">Service</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previousTokens.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{t.tokenNumber}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{t.organizationId?.name || '—'}</td>
                      <td className="py-3 px-3 text-slate-600">{t.serviceId?.name || '—'}</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {t.status === 'COMPLETED' ? (
                          <Link
                            to={`/feedback/${t._id}`}
                            className="inline-flex items-center space-x-1 text-amber-600 hover:text-amber-700 font-semibold text-[11px] bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                          >
                            <span>Rate Service ⭐</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleRejoinToken(t)}
                            className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-semibold text-[11px] bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200 transition"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Rejoin Queue</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} SmartQueue. Universal Token Management System.</p>
      </footer>
    </div>
  );
}
