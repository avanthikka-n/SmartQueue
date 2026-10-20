import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';
import { Plus, Edit2, Trash2, Users, X, AlertCircle, Mail, Phone, Lock, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    designation: '',
    departmentId: '',
    counterId: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, deptsRes, countersRes] = await Promise.all([
        api.get('/api/staff'),
        api.get('/api/departments'),
        api.get('/api/counters')
      ]);
      setStaffList(staffRes.data.staff || []);
      setDepartments(deptsRes.data.departments || []);
      setCounters(countersRes.data.counters || []);
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (staff = null) => {
    setError('');
    if (staff) {
      setEditStaff(staff);
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        password: '',
        confirmPassword: '',
        designation: staff.designation || '',
        departmentId: staff.departmentId?._id || staff.departmentId || '',
        counterId: staff.counterId?._id || staff.counterId || ''
      });
    } else {
      setEditStaff(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        designation: '',
        departmentId: departments[0]?._id || '',
        counterId: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.name.trim()) {
      setError('Staff member full name is required');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('A valid email address is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!editStaff) {
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (editStaff) {
        await api.put(`/api/staff/${editStaff._id}`, {
          name: formData.name,
          phone: formData.phone,
          designation: formData.designation,
          departmentId: formData.departmentId,
          counterId: formData.counterId
        });
      } else {
        await api.post('/api/staff', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Please check form inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff account?')) return;
    try {
      await api.delete(`/api/staff/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  const handleToggleActive = async (stf) => {
    const action = stf.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${stf.name}?`)) return;
    try {
      await api.patch(`/api/staff/${stf._id}/status`, { isActive: !stf.isActive });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} staff account`);
    }
  };

  const handleOpenResetModal = (stf) => {
    setResetTarget(stf);
    setNewPassword('');
    setResetError('');
    setResetSuccess('');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    try {
      const res = await api.put(`/api/staff/${resetTarget._id}/reset-password`, { newPassword });
      setResetSuccess(res.data.message || 'Password reset successfully.');
      setNewPassword('');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Staff Management</h2>
            <p className="text-sm text-slate-500">Register new staff members and configure department & counter assignments</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center space-x-2 transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading staff accounts...</div>
          ) : staffList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No staff accounts registered yet.</p>
              <p className="text-xs mt-1 text-slate-500">Click "Add New Staff" to create an active service console account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Staff Member</th>
                    <th className="py-3.5 px-6">Designation</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Assigned Counter</th>
                    <th className="py-3.5 px-6">Contact</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {staffList.map((stf) => (
                    <tr key={stf._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{stf.name}</div>
                        <div className="text-xs text-slate-500">{stf.email}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-700 text-xs font-medium">
                        {stf.designation || <span className="text-slate-400 italic">Staff Operator</span>}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {stf.departmentId?.name || <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-700">
                        {stf.counterId ? (
                          <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 font-semibold text-slate-800">
                            {stf.counterId.name} (#{stf.counterId.counterNumber})
                          </span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs">{stf.phone}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${stf.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {stf.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() => handleOpenModal(stf)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Staff"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenResetModal(stf)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(stf)}
                          className={`p-1.5 rounded-lg transition ${stf.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                          title={stf.isActive ? 'Deactivate Staff' : 'Activate Staff'}
                        >
                          {stf.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(stf._id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Staff"
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
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editStaff ? 'Edit Staff Details' : 'Register New Staff Member'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editStaff ? 'Modify assignment or contact information' : 'Create credentials for service and queue management'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editStaff}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@hospital.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Designation / Job Title
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Senior Nurse, Teller, Customer Officer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              {!editStaff && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-type password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, counterId: '' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Select the operational department the staff operates in.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Counter
                </label>
                <select
                  value={formData.counterId}
                  onChange={(e) => setFormData({ ...formData, counterId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="">Unassigned</option>
                  {counters
                    .filter(c => {
                      if (!formData.departmentId) return true;
                      const deptId = c.departmentId?._id || c.departmentId;
                      return deptId?.toString() === formData.departmentId?.toString();
                    })
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} (#{c.counterNumber})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {formData.departmentId
                    ? 'Counters filtered by selected department.'
                    : 'Select a department above to filter counters.'}
                </p>
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
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editStaff ? 'Update Staff Member' : 'Register Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && resetTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">{resetTarget.name} · {resetTarget.email}</p>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{resetError}</span>
              </div>
            )}
            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                ✓ {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
