import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react';

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/appointments');
      setAppointments(res.data.appointments);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCheckIn = async (id) => {
    try {
      const res = await api.post(`/api/appointments/${id}/check-in`);
      if (res.data.success) {
        alert(`Checked in! Generated token ${res.data.token.tokenNumber}`);
        fetchAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Appointment Management</h2>
          <p className="text-sm text-slate-500">View customer advance bookings and perform arrival check-ins</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No appointments booked yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-6">Service</th>
                    <th className="py-3.5 px-6">Date & Time</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Generated Token</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {appointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{appt.customerName}</div>
                        <div className="text-xs text-slate-500">{appt.customerPhone}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{appt.serviceId?.name}</td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          appt.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-brand-600">
                        {appt.tokenId ? appt.tokenId.tokenNumber : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {appt.status === 'BOOKED' && (
                          <button
                            onClick={() => handleCheckIn(appt._id)}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                          >
                            Check-In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
