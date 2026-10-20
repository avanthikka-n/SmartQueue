import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Clock,
  PauseCircle,
  PlayCircle,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    facilityId: '',
    openTime: '08:00',
    closeTime: '18:00',
    dailyTokenLimit: 0,
    noShowTimeoutSeconds: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, facRes] = await Promise.all([
        api.get('/api/departments'),
        api.get('/api/facilities')
      ]);

      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments || []);
      }
      if (facRes.data.success) {
        setFacilities(facRes.data.facilities || []);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (dept = null) => {
    setError('');
    setSuccess('');
    if (dept) {
      setEditDept(dept);
      setFormData({
        name: dept.name,
        description: dept.description || '',
        facilityId: dept.facilityId?._id || dept.facilityId || '',
        openTime: dept.workingHours?.open || '08:00',
        closeTime: dept.workingHours?.close || '18:00',
        dailyTokenLimit: dept.dailyTokenLimit || 0,
        noShowTimeoutSeconds: dept.noShowTimeoutSeconds !== null && dept.noShowTimeoutSeconds !== undefined ? dept.noShowTimeoutSeconds : ''
      });
    } else {
      setEditDept(null);
      setFormData({
        name: '',
        description: '',
        facilityId: facilities.length > 0 ? facilities[0]._id : '',
        openTime: '08:00',
        closeTime: '18:00',
        dailyTokenLimit: 0,
        noShowTimeoutSeconds: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        facilityId: formData.facilityId || undefined,
        workingHours: {
          open: formData.openTime,
          close: formData.closeTime
        },
        dailyTokenLimit: Number(formData.dailyTokenLimit) || 0,
        noShowTimeoutSeconds: formData.noShowTimeoutSeconds === '' ? null : Number(formData.noShowTimeoutSeconds)
      };

      if (editDept) {
        await api.put(`/api/departments/${editDept._id}`, payload);
        setSuccess('Department updated successfully');
      } else {
        await api.post('/api/departments', payload);
        setSuccess('Department created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async (dept) => {
    try {
      await api.patch(`/api/departments/${dept._id}/pause`, {
        isPaused: !dept.isPaused,
        pauseReason: !dept.isPaused ? 'Paused by administrator' : ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle pause status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    try {
      await api.delete(`/api/departments/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <span>Department Management</span>
            </h2>
            <p className="text-sm text-slate-500">
              Configure organizational departments, facilities, operating hours, and queue limits.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center space-x-2 transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No departments configured</p>
              <p className="text-xs text-slate-400 mt-1">Get started by creating your first department.</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Create Department
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Department Name</th>
                    <th className="py-3 px-6">Facility</th>
                    <th className="py-3 px-6">Operating Hours</th>
                    <th className="py-3 px-6">Daily Limit</th>
                    <th className="py-3 px-6">Queue Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {dept.name}
                        {dept.description && (
                          <span className="block text-xs font-normal text-slate-400 mt-0.5 max-w-sm truncate">
                            {dept.description}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{dept.facilityId?.name || 'Main Facility'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            {dept.workingHours?.open || '08:00'} - {dept.workingHours?.close || '18:00'}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                        {dept.dailyTokenLimit > 0 ? `${dept.dailyTokenLimit} max` : 'Unlimited'}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        {dept.isPaused ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Paused</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleTogglePause(dept)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              dept.isPaused
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                            title={dept.isPaused ? 'Resume Queue' : 'Pause Queue'}
                          >
                            {dept.isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenModal(dept)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Department"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept._id, dept.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editDept ? 'Edit Department' : 'Create Department'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cardiology, Cash Deposit, Lab"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facility / Branch Location
                  </label>
                  <select
                    value={formData.facilityId}
                    onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {facilities.map((fac) => (
                      <option key={fac._id} value={fac._id}>
                        {fac.name} ({fac.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of department services..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daily Token Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.dailyTokenLimit}
                      onChange={(e) => setFormData({ ...formData, dailyTokenLimit: e.target.value })}
                      placeholder="0 = unlimited"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">0 for unlimited</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Auto-Skip Override (s)
                    </label>
                    <input
                      type="number"
                      min="30"
                      value={formData.noShowTimeoutSeconds}
                      onChange={(e) => setFormData({ ...formData, noShowTimeoutSeconds: e.target.value })}
                      placeholder="Inherit org (300)"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Leave blank to inherit</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editDept ? 'Update Department' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
