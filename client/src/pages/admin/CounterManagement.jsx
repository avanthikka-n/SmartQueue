import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';
import { Plus, Edit2, Trash2, Monitor, X, AlertCircle } from 'lucide-react';

export default function CounterManagement() {
  const [counters, setCounters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCounter, setEditCounter] = useState(null);

  const [formData, setFormData] = useState({
    departmentId: '',
    name: '',
    counterNumber: 1,
    status: 'offline'
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [countersRes, deptsRes] = await Promise.all([
        api.get('/api/counters'),
        api.get('/api/departments')
      ]);
      setCounters(countersRes.data.counters);
      setDepartments(deptsRes.data.departments);
    } catch (err) {
      console.error('Failed to load counters data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (counter = null) => {
    setError('');
    if (counter) {
      setEditCounter(counter);
      setFormData({
        departmentId: counter.departmentId?._id || counter.departmentId || '',
        name: counter.name,
        counterNumber: counter.counterNumber,
        status: counter.status || 'offline'
      });
    } else {
      setEditCounter(null);
      setFormData({
        departmentId: departments[0]?._id || '',
        name: `Counter ${counters.length + 1}`,
        counterNumber: counters.length + 1,
        status: 'offline'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editCounter) {
        await api.put(`/api/counters/${editCounter._id}`, formData);
      } else {
        await api.post('/api/counters', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this counter?')) return;
    try {
      await api.delete(`/api/counters/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete counter');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Counter Management</h2>
            <p className="text-sm text-slate-500">Configure physical counters and desks for department staff</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={departments.length === 0}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center space-x-2 transition self-start disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Counter</span>
          </button>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading counters...</div>
          ) : counters.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Monitor className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No counters configured yet.</p>
              <p className="text-xs mt-1">Click "Add Counter" to create your first desk.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Counter Name</th>
                    <th className="py-3.5 px-6">Number</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Assigned Staff</th>
                    <th className="py-3.5 px-6">Live Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {counters.map((cnt) => (
                    <tr key={cnt._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-semibold text-slate-900">{cnt.name}</td>
                      <td className="py-4 px-6 font-mono text-slate-700 font-bold">#{cnt.counterNumber}</td>
                      <td className="py-4 px-6 text-slate-600">
                        <span>{cnt.departmentId?.name || 'Unassigned'}</span>
                        {cnt.facilityId?.name && (
                          <span className="text-[11px] text-slate-400 block">{cnt.facilityId.name}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {cnt.assignedStaff && cnt.assignedStaff.length > 0 ? (
                          <span>{cnt.assignedStaff.map(s => s.name).join(', ')}</span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          cnt.status === 'busy' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          cnt.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {cnt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(cnt)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Counter"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cnt._id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Counter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editCounter ? 'Edit Counter' : 'Create New Counter'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Counter Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Counter 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Counter #</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.counterNumber}
                    onChange={(e) => setFormData({ ...formData, counterNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="offline">Offline</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm"
                >
                  {submitting ? 'Saving...' : editCounter ? 'Update Counter' : 'Create Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
