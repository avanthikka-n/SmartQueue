import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import {
  Building2,
  Sliders,
  Monitor,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  Settings,
  AlertCircle,
  CheckCircle2,
  Activity,
  Ticket,
  Timer,
  CheckCheck,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    facilities: 0,
    departments: 0,
    services: 0,
    counters: 0,
    staff: 0,
    loading: true
  });

  const [metrics, setMetrics] = useState({
    waitingTokens: 0,
    inServiceTokens: 0,
    completedTokens: 0,
    averageWaitTimeMinutes: 0
  });

  const [departments, setDepartments] = useState([]);
  const [perStaffStats, setPerStaffStats] = useState([]);
  const [organization, setOrganization] = useState(null);

  // Settings Modal State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(300);
  const [savingSettings, setSavingSettings] = useState(false);

  // Pause Department Modal State
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [pauseReasonInput, setPauseReasonInput] = useState('');
  const [togglingPause, setTogglingPause] = useState(false);

  const [notification, setNotification] = useState({ error: '', success: '' });

  const loadDashboardData = async () => {
    try {
      const [facRes, deptsRes, servicesRes, countersRes, staffRes, analyticsRes] = await Promise.all([
        api.get('/api/facilities'),
        api.get('/api/departments'),
        api.get('/api/services'),
        api.get('/api/counters'),
        api.get('/api/staff'),
        api.get('/api/analytics')
      ]);

      setStats({
        facilities: facRes.data.count || 0,
        departments: deptsRes.data.count || 0,
        services: servicesRes.data.count || 0,
        counters: countersRes.data.count || 0,
        staff: staffRes.data.count || 0,
        loading: false
      });

      setDepartments(deptsRes.data.departments || []);

      if (analyticsRes.data.success) {
        setMetrics(analyticsRes.data.metrics || {});
        setPerStaffStats(analyticsRes.data.perStaffStats || []);
      }

      // Load organization info
      const orgId = user?.organizationId?._id || user?.organizationId;
      if (orgId) {
        const orgRes = await api.get(`/api/organizations/${orgId}`);
        if (orgRes.data.success) {
          setOrganization(orgRes.data.organization);
          setTimeoutSeconds(orgRes.data.organization?.settings?.noShowTimeoutSeconds || 300);
        }
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleTogglePause = async (dept) => {
    if (!dept.isPaused) {
      // Prompt for reason when pausing
      setSelectedDept(dept);
      setPauseReasonInput('');
      setPauseModalOpen(true);
    } else {
      // Resume immediately
      try {
        setTogglingPause(true);
        await api.patch(`/api/departments/${dept._id}/pause`, {
          isPaused: false,
          pauseReason: ''
        });
        setNotification({ error: '', success: `Queue for ${dept.name} resumed successfully.` });
        loadDashboardData();
      } catch (err) {
        setNotification({ error: err.response?.data?.message || 'Failed to resume queue', success: '' });
      } finally {
        setTogglingPause(false);
      }
    }
  };

  const confirmPause = async () => {
    if (!selectedDept) return;
    try {
      setTogglingPause(true);
      await api.patch(`/api/departments/${selectedDept._id}/pause`, {
        isPaused: true,
        pauseReason: pauseReasonInput.trim() || 'Temporarily paused by administrator'
      });
      setNotification({ error: '', success: `Queue for ${selectedDept.name} paused.` });
      setPauseModalOpen(false);
      loadDashboardData();
    } catch (err) {
      setNotification({ error: err.response?.data?.message || 'Failed to pause queue', success: '' });
    } finally {
      setTogglingPause(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setNotification({ error: '', success: '' });

    try {
      const orgId = user?.organizationId?._id || user?.organizationId;
      await api.put(`/api/organizations/${orgId}`, {
        settings: {
          noShowTimeoutSeconds: Number(timeoutSeconds)
        }
      });
      setNotification({ error: '', success: 'Organization settings updated successfully!' });
      setSettingsModalOpen(false);
      loadDashboardData();
    } catch (err) {
      setNotification({ error: err.response?.data?.message || 'Failed to update settings', success: '' });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Administrator'}! 👋
            </h2>
            <p className="mt-1 text-brand-100 text-sm max-w-2xl">
              Live operational monitoring for{' '}
              <span className="font-semibold text-white">
                {organization?.name || user?.organizationId?.name || 'your organization'}
              </span>
              . Auto-skip timeout is currently set to{' '}
              <span className="font-semibold text-amber-200">
                {Math.round(timeoutSeconds / 60)} minutes ({timeoutSeconds}s)
              </span>
              .
            </p>
          </div>
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="px-3.5 py-2.5 bg-brand-800/60 hover:bg-brand-800 text-white font-semibold text-sm rounded-xl border border-brand-500/30 transition flex items-center space-x-2"
            >
              <Settings className="w-4 h-4 text-brand-200" />
              <span>Org Settings</span>
            </button>
            <Link
              to="/admin/staff"
              className="px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 font-semibold text-sm rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-brand-600" />
              <span>Staff Management</span>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {notification.error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{notification.error}</span>
          </div>
        )}
        {notification.success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{notification.success}</span>
          </div>
        )}

        {/* Live Operational Metrics Today */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Live Waiting Queue
              </span>
              <p className="text-3xl font-extrabold text-brand-600 mt-2">
                {stats.loading ? '...' : metrics.waitingTokens}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">Active waiting customers</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Currently Serving
              </span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-2">
                {stats.loading ? '...' : metrics.inServiceTokens}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">Tokens at active counters</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Tokens Served Today
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                {stats.loading ? '...' : metrics.completedTokens}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">Completed sessions today</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Average Wait Time
              </span>
              <p className="text-3xl font-extrabold text-amber-600 mt-2">
                {stats.loading ? '...' : `${metrics.averageWaitTimeMinutes || 0}m`}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">From ticket to called</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Timer className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Operational Department Queues with Pause/Resume */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Department Queues & Operational Controls
              </h3>
              <p className="text-xs text-slate-500">
                Pause or resume queues in real-time, inspect working hours, and review token limits.
              </p>
            </div>
            <Link
              to="/admin/departments"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>Manage Departments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {departments.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No departments created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Facility</th>
                    <th className="pb-3">Working Hours</th>
                    <th className="pb-3">Daily Limit</th>
                    <th className="pb-3">Queue Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 font-bold text-slate-800">
                        {dept.name}
                        {dept.description && (
                          <span className="block text-xs font-normal text-slate-400 truncate max-w-xs">
                            {dept.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-xs text-slate-600">
                        {dept.facilityId?.name || 'Main Facility'}
                      </td>
                      <td className="py-3.5 text-xs text-slate-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {dept.workingHours?.open || '08:00'} - {dept.workingHours?.close || '18:00'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-600 font-mono">
                        {dept.dailyTokenLimit > 0 ? `${dept.dailyTokenLimit} max` : 'Unlimited'}
                      </td>
                      <td className="py-3.5 text-xs">
                        {dept.isPaused ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Paused ({dept.pauseReason || 'Break'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleTogglePause(dept)}
                          disabled={togglingPause}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                            dept.isPaused
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-white'
                          }`}
                        >
                          {dept.isPaused ? (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Resume Queue</span>
                            </>
                          ) : (
                            <>
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>Pause Queue</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-Staff Performance Stats Today */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Per-Staff Daily Performance</h3>
              <p className="text-xs text-slate-500">Live token service volume by staff members today</p>
            </div>
            <Link
              to="/admin/staff"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>View All Staff</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {perStaffStats.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm">
              No staff activity recorded yet today. Staff stats appear once tokens are called.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Staff Name</th>
                    <th className="pb-3">Designation / Role</th>
                    <th className="pb-3 text-center">Served Today</th>
                    <th className="pb-3 text-center">Completed</th>
                    <th className="pb-3 text-center">Skipped</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {perStaffStats.map((item) => (
                    <tr key={item.staffId} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-semibold text-slate-800">
                        {item.name}
                        {item.email && (
                          <span className="block text-[11px] font-normal text-slate-400">{item.email}</span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-slate-600 font-medium">
                        {item.designation || 'Service Agent'}
                      </td>
                      <td className="py-3 text-center font-bold text-brand-600">
                        {item.totalServed}
                      </td>
                      <td className="py-3 text-center font-bold text-emerald-600">
                        {item.completed}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-500">
                        {item.skipped}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Setup & Entity Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/facilities"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Facilities</span>
              <MapPin className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.facilities}</p>
            <span className="text-xs text-brand-600 font-semibold mt-2 flex items-center space-x-1">
              <span>Manage</span> <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/admin/departments"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Departments</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.departments}</p>
            <span className="text-xs text-brand-600 font-semibold mt-2 flex items-center space-x-1">
              <span>Manage</span> <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/admin/services"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Services</span>
              <Sliders className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.services}</p>
            <span className="text-xs text-brand-600 font-semibold mt-2 flex items-center space-x-1">
              <span>Manage</span> <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/admin/counters"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Counters</span>
              <Monitor className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.counters}</p>
            <span className="text-xs text-brand-600 font-semibold mt-2 flex items-center space-x-1">
              <span>Manage</span> <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/admin/staff"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Staff</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.staff}</p>
            <span className="text-xs text-brand-600 font-semibold mt-2 flex items-center space-x-1">
              <span>Manage</span> <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

        {/* Organization Settings Modal */}
        {settingsModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-brand-600" />
                  <span>Organization Queue Settings</span>
                </h3>
                <button
                  onClick={() => setSettingsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auto-Skip / No-Show Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="3600"
                    required
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Default is 300 seconds (5 minutes). When a customer is called and does not arrive
                    within this duration, their token is automatically marked as SKIPPED.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSettingsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pause Queue Modal */}
        {pauseModalOpen && selectedDept && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <PauseCircle className="w-5 h-5 text-amber-500" />
                  <span>Pause Department Queue</span>
                </h3>
                <button
                  onClick={() => setPauseModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-600">
                  Pausing <strong className="text-slate-900">{selectedDept.name}</strong> will temporarily
                  prevent customers from generating new tokens for this department.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Pause (Optional)
                  </label>
                  <input
                    type="text"
                    value={pauseReasonInput}
                    onChange={(e) => setPauseReasonInput(e.target.value)}
                    placeholder="e.g. Lunch break until 2:00 PM, Emergency rounds"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPauseModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPause}
                    disabled={togglingPause}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {togglingPause ? 'Pausing...' : 'Confirm Pause'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
