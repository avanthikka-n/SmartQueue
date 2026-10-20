import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

const RATING_LABEL = { 1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent' };
const RATING_COLOR = {
  1: 'text-red-600 bg-red-50',
  2: 'text-orange-600 bg-orange-50',
  3: 'text-yellow-600 bg-yellow-50',
  4: 'text-emerald-600 bg-emerald-50',
  5: 'text-green-600 bg-green-50'
};

export default function FeedbackManagement() {
  const [feedback, setFeedback] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/feedback');
      setFeedback(res.data.feedback || []);
      setAverageRating(res.data.averageRating || 0);
      setCount(res.data.count || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const c = feedback.filter((f) => f.rating === star).length;
    const pct = count > 0 ? Math.round((c / count) * 100) : 0;
    return { star, count: c, pct };
  });

  const filtered = ratingFilter === 'all' ? feedback : feedback.filter((f) => f.rating === Number(ratingFilter));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Customer Feedback</h1>
            <p className="text-sm text-slate-500 mt-1">{count} response{count !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={fetchFeedback}
            disabled={loading}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* Summary Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Rating</p>
            <p className="text-6xl font-extrabold text-slate-900">{averageRating.toFixed(1)}</p>
            <div className="mt-2">
              <StarDisplay rating={averageRating} />
            </div>
            <p className="text-sm text-slate-400 mt-2">based on {count} review{count !== 1 ? 's' : ''}</p>
          </div>

          {/* Rating Distribution */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <p className="text-sm font-semibold text-slate-700 mb-4">Rating Distribution</p>
            <div className="space-y-3">
              {distribution.map(({ star, count: c, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16 shrink-0">
                    <span className="text-sm font-semibold text-slate-700">{star}</span>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-slate-500 shrink-0">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Filter by rating:</span>
          {['all', '5', '4', '3', '2', '1'].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                ratingFilter === r
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? 'All' : `${r} ★`}
            </button>
          ))}
        </div>

        {/* Feedback Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto" />
            <p className="text-slate-400 text-sm mt-3">Loading feedback...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="font-medium text-slate-500">No feedback found</p>
            <p className="text-sm mt-1">
              {ratingFilter !== 'all' ? `No ${ratingFilter}-star reviews yet.` : 'Customers can leave feedback after their service is completed.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Token</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Comment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {f.customerName || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {f.tokenId?.tokenNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.serviceId?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.departmentId?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={f.rating} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RATING_COLOR[f.rating] || ''}`}>
                          {RATING_LABEL[f.rating]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs">
                      {f.comment ? (
                        <span className="line-clamp-2">{f.comment}</span>
                      ) : (
                        <span className="italic text-slate-300">No comment</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                      {new Date(f.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
