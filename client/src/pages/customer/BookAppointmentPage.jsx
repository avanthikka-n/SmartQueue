import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Calendar, Clock, User, Phone, Mail, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

export default function BookAppointmentPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get('/api/services');
        const srv = res.data.services.find(s => s._id === serviceId);
        setService(srv);
      } catch (err) {
        console.error('Failed to load service for appointment', err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/api/appointments', {
        organizationId: service.organizationId,
        departmentId: service.departmentId?._id || service.departmentId,
        serviceId: service._id,
        customerName,
        customerPhone,
        customerEmail,
        appointmentDate,
        appointmentTime
      });

      if (res.data.success) {
        setBookingSuccess(res.data.appointment);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckInNow = async () => {
    if (!bookingSuccess) return;
    try {
      const res = await api.post(`/api/appointments/${bookingSuccess._id}/check-in`);
      if (res.data.success) {
        navigate(`/token/${res.data.token._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base">
              SQ
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Smart<span className="text-brand-600">Queue</span></span>
          </Link>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-1">
        {bookingSuccess ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-2xl">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-900">Appointment Confirmed!</h2>
            <p className="text-sm text-slate-500">
              Your appointment for <span className="font-bold text-slate-800">{service?.name}</span> is booked.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-mono font-bold text-brand-600">APP-{bookingSuccess._id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-semibold text-slate-800">{new Date(bookingSuccess.appointmentDate).toLocaleDateString()} at {bookingSuccess.appointmentTime}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleCheckInNow}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                CHECK IN NOW (INJECT TO QUEUE)
              </button>
              <Link to="/organizations" className="inline-block text-xs font-semibold text-slate-600 hover:underline">
                Return to Organization Selector
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold border border-brand-200 uppercase">
                Advance Booking
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-3">{service?.name}</h1>
              <p className="text-xs text-slate-500 mt-1">Book a slot in advance and check in upon facility arrival.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="555-0199"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Time Slot</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none bg-white"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition mt-6 disabled:opacity-50"
              >
                <span>{submitting ? 'Booking...' : 'CONFIRM APPOINTMENT BOOKING'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
