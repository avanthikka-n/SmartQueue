import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Phone,
  Mail,
  Building2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export default function FacilityManagement() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'hospital',
    address: '',
    phone: '',
    email: '',
    description: '',
    openTime: '08:00',
    closeTime: '18:00'
  });
  const [saving, setSaving] = useState(false);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/facilities');
      if (res.data.success) {
        setFacilities(res.data.facilities || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const openCreateModal = () => {
    setEditingFacility(null);
    setFormData({
      name: '',
      type: user?.organizationId?.type || 'hospital',
      address: '',
      phone: '',
      email: '',
      description: '',
      openTime: '08:00',
      closeTime: '18:00'
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      type: facility.type || 'other',
      address: facility.address || '',
      phone: facility.phone || '',
      email: facility.email || '',
      description: facility.description || '',
      openTime: facility.workingHours?.open || '08:00',
      closeTime: facility.workingHours?.close || '18:00'
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
        workingHours: {
          open: formData.openTime,
          close: formData.closeTime,
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      };

      if (editingFacility) {
        await api.put(`/api/facilities/${editingFacility._id}`, payload);
        setSuccess('Facility updated successfully!');
      } else {
        await api.post('/api/facilities', payload);
        setSuccess('Facility created successfully!');
      }

      setModalOpen(false);
      fetchFacilities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save facility');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete facility "${name}"?`)) return;
    try {
      await api.delete(`/api/facilities/${id}`);
      setSuccess(`Facility "${name}" removed successfully`);
      fetchFacilities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete facility');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-brand-600" />
              <span>Facility Management</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage physical branches, clinic locations, hospital campuses, and service centers.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Facility</span>
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

        {/* Facilities Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-medium">Loading facilities...</div>
        ) : facilities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Facilities Configured</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by adding your primary location or branch.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Add First Facility
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((fac) => (
              <div
                key={fac._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                        {fac.type}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">{fac.name}</h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(fac)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition"
                        title="Edit Facility"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fac._id, fac.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                        title="Delete Facility"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {fac.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{fac.description}</p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    {fac.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{fac.address}</span>
                      </div>
                    )}
                    {fac.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{fac.phone}</span>
                      </div>
                    )}
                    {fac.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{fac.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>
                        Hours: {fac.workingHours?.open || '08:00'} - {fac.workingHours?.close || '18:00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Status: <strong className="text-emerald-600">Active</strong></span>
                  <span className="font-mono text-[10px]">ID: {fac._id.slice(-6)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingFacility ? 'Edit Facility' : 'Create New Facility'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apollo Hospital - Main Campus"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Facility Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="hospital">Hospital</option>
                      <option value="clinic">Clinic</option>
                      <option value="bank">Bank</option>
                      <option value="government">Government Office</option>
                      <option value="service_center">Service Center</option>
                      <option value="hotel">Hotel</option>
                      <option value="education">Education</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 21 Greams Lane, Thousand Lights, Chennai"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@apollohospital.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
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

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingFacility ? 'Update Facility' : 'Create Facility'}
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
