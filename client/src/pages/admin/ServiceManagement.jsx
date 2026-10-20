import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';
import { Plus, Edit2, Trash2, Sliders, X, AlertCircle, Clock, Tag } from 'lucide-react';

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState(null);

  const [formData, setFormData] = useState({
    departmentId: '',
    name: '',
    description: '',
    prefix: '',
    estimatedServiceTime: 10,
    priorityEnabled: true,
    appointmentEnabled: true,
    nextServiceId: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, deptsRes] = await Promise.all([
        api.get('/api/services'),
        api.get('/api/departments')
      ]);
      setServices(servicesRes.data.services);
      setDepartments(deptsRes.data.departments);
    } catch (err) {
      console.error('Failed to load services data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (service = null) => {
    setError('');
    if (service) {
      setEditService(service);
      setFormData({
        departmentId: service.departmentId?._id || service.departmentId || '',
        name: service.name,
        description: service.description || '',
        prefix: service.prefix,
        estimatedServiceTime: service.estimatedServiceTime || 10,
        dailyTokenLimit: service.dailyTokenLimit || 0,
        priorityEnabled: service.priorityEnabled !== undefined ? service.priorityEnabled : true,
        appointmentEnabled: service.appointmentEnabled !== undefined ? service.appointmentEnabled : true,
        nextServiceId: service.nextServiceId?._id || service.nextServiceId || ''
      });
    } else {
      setEditService(null);
      setFormData({
        departmentId: departments[0]?._id || '',
        name: '',
        description: '',
        prefix: '',
        estimatedServiceTime: 10,
        dailyTokenLimit: 0,
        priorityEnabled: true,
        appointmentEnabled: true,
        nextServiceId: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editService) {
        await api.put(`/api/services/${editService._id}`, formData);
      } else {
        await api.post('/api/services', formData);
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
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/api/services/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete service');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Service Management</h2>
            <p className="text-sm text-slate-500">Define customer services, token prefix codes, and target time limits</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={departments.length === 0}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center space-x-2 transition self-start disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>

        {departments.length === 0 && !loading && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            ⚠️ Please create at least one Department before adding Services.
          </div>
        )}

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No services configured yet.</p>
              <p className="text-xs mt-1">Click "Add Service" to set up your first queue offering.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Service & Department</th>
                    <th className="py-3.5 px-6">Token Prefix</th>
                    <th className="py-3.5 px-6">Avg Duration</th>
                    <th className="py-3.5 px-6">Features</th>
                    <th className="py-3.5 px-6">Next Step</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {services.map((srv) => (
                    <tr key={srv._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{srv.name}</div>
                        <div className="text-xs text-slate-500">{srv.departmentId?.name || 'Unassigned'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-brand-50 text-brand-700 font-mono font-bold text-xs rounded-lg border border-brand-200">
                          {srv.prefix}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{srv.estimatedServiceTime} mins</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {srv.priorityEnabled && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200">
                              Priority
                            </span>
                          )}
                          {srv.appointmentEnabled && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                              Appointments
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {srv.nextServiceId ? (
                          <span className="font-medium text-slate-800">➜ {srv.nextServiceId.name}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(srv)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Service"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv._id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Service"
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editService ? 'Edit Service' : 'Create New Service'}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dermatology Consultation or Cash Deposit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Token Prefix</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. A, ECG"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">e.g. A-001, ECG-001</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Est. Mins</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.estimatedServiceTime}
                    onChange={(e) => setFormData({ ...formData, estimatedServiceTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Daily Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.dailyTokenLimit}
                    onChange={(e) => setFormData({ ...formData, dailyTokenLimit: e.target.value })}
                    placeholder="0 = unlimited"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">0 = unlimited</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center space-x-2 text-sm text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.priorityEnabled}
                    onChange={(e) => setFormData({ ...formData, priorityEnabled: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                  <span>Enable Priority Queueing (Emergency, Senior Citizen)</span>
                </label>

                <label className="flex items-center space-x-2 text-sm text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.appointmentEnabled}
                    onChange={(e) => setFormData({ ...formData, appointmentEnabled: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                  <span>Allow Advance Online Appointments</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Next Service Step (Multi-Step Flow)</label>
                <select
                  value={formData.nextServiceId}
                  onChange={(e) => setFormData({ ...formData, nextServiceId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="">None (Single Service)</option>
                  {services.filter(s => s._id !== editService?._id).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.prefix})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Allows staff to transfer completed customer to next department (e.g. Consultation ➔ Lab).</p>
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
                  {submitting ? 'Saving...' : editService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
