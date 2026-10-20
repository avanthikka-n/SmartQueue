import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#10b981', '#f59e0b'];

function MetricCard({ label, value, unit = '', color = 'text-slate-900', bg = 'bg-white' }) {
  return (
    <div className={`${bg} rounded-xl shadow p-5 flex flex-col gap-1`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>
        {value}
        {unit && <span className="text-sm font-medium text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/analytics');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time data for today — auto-refreshes every 30s</p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-5 h-24 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <MetricCard
                label="Total Tokens Today"
                value={data.metrics.totalTokensToday}
                color="text-brand-700"
              />
              <MetricCard
                label="Waiting"
                value={data.metrics.waitingTokens}
                color="text-yellow-600"
              />
              <MetricCard
                label="In Service"
                value={data.metrics.inServiceTokens}
                color="text-blue-600"
              />
              <MetricCard
                label="Completed"
                value={data.metrics.completedTokens}
                color="text-emerald-600"
              />
              <MetricCard
                label="Skipped"
                value={data.metrics.skippedTokens}
                color="text-orange-600"
              />
              <MetricCard
                label="Avg Wait Time"
                value={data.metrics.averageWaitTimeMinutes}
                unit="min"
                color="text-purple-600"
              />
              <MetricCard
                label="Avg Service Time"
                value={data.metrics.averageServiceTimeMinutes}
                unit="min"
                color="text-indigo-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tokens by Hour */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
                <h2 className="text-base font-bold text-slate-800 mb-4">Tokens by Hour (Today)</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.tokensByHour} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [v, 'Tokens']}
                    />
                    <Bar dataKey="tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Completed vs Skipped Pie */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-base font-bold text-slate-800 mb-4">Completion Rate</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.completedVsSkipped}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.completedVsSkipped.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Breakdown */}
            {data.tokensByDepartment && data.tokensByDepartment.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-base font-bold text-slate-800 mb-4">All-Time Tokens by Department</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.tokensByDepartment}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#475569' }}
                      width={80}
                    />
                    <Tooltip formatter={(v) => [v, 'Tokens']} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.tokensByDepartment && data.tokensByDepartment.length === 0 && (
              <div className="bg-white rounded-xl shadow p-8 text-center text-slate-400">
                <p className="text-lg">No department data yet. Generate some tokens to see the breakdown.</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
