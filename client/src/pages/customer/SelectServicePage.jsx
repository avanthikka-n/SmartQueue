import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Building2, Sliders, Clock, Users, ArrowRight, Shield, QrCode, AlertCircle } from 'lucide-react';

export default function SelectServicePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const preselectedServiceId = searchParams.get('serviceId');
  const isQrScan = searchParams.get('qr') === '1';

  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  // Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [priority, setPriority] = useState('NORMAL');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;
      try {
        setLoading(true);
        const [orgRes, deptsRes, servicesRes] = await Promise.all([
          api.get(`/api/organizations/${organizationId}`),
          api.get('/api/departments', { params: { organizationId } }),
          api.get('/api/services', { params: { organizationId } })
        ]);

        setOrganization(orgRes.data.organization);
        setDepartments(deptsRes.data.departments);
        setServices(servicesRes.data.services);

        if (deptsRes.data.departments.length > 0) {
          setSelectedDeptId(deptsRes.data.departments[0]._id);
        }

        if (preselectedServiceId) {
          const match = servicesRes.data.services.find(s => s._id === preselectedServiceId);
          if (match) {
            setSelectedService(match);
            setSelectedDeptId(match.departmentId?._id || match.departmentId);
          }
        }
      } catch (err) {
        console.error('Failed to load service selection data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, preselectedServiceId]);

  const filteredServices = services.filter(
    (s) => !selectedDeptId || (s.departmentId?._id === selectedDeptId || s.departmentId === selectedDeptId)
  );

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!selectedService) {
      setError('Please select a service');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const res = await api.post('/api/tokens', {
        organizationId,
        departmentId: selectedService.departmentId?._id || selectedService.departmentId || selectedDeptId,
        serviceId: selectedService._id,
        customerName,
        customerPhone,
        priority,
        notes
      });

      if (res.data.success) {
        const tokenId = res.data.token._id;
        navigate(`/token/${tokenId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate token. Please try again.');
    } finally {
      setGenerating(false);
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
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              SQ
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Smart<span className="text-brand-600">Queue</span></span>
          </Link>
          <Link to="/organizations" className="text-xs font-semibold text-brand-600 hover:underline">
            ← Change Organization
          </Link>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* QR Code Banner */}
        {isQrScan && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm flex items-center space-x-3">
            <QrCode className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Scanned via Facility QR Code</p>
              <p className="text-xs text-indigo-600 mt-0.5">Please confirm your details below to instantly generate your token.</p>
            </div>
          </div>
        )}

        {/* Header Org Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold text-2xl uppercase">
              {organization?.name?.charAt(0) || 'O'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{organization?.name}</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                {organization?.type} Facility
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Department Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            1. Select Department
          </label>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {departments.map((d) => (
              <button
                key={d._id}
                onClick={() => {
                  setSelectedDeptId(d._id);
                  setSelectedService(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                  selectedDeptId === d._id
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Service Grid */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            2. Choose Service Offering
          </label>

          {filteredServices.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              No services active in this department.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((srv) => {
                const isSelected = selectedService?._id === srv._id;
                return (
                  <div
                    key={srv._id}
                    onClick={() => setSelectedService(srv)}
                    className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded border border-slate-200">
                          Prefix {srv.prefix}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{srv.estimatedServiceTime}m</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{srv.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{srv.description || 'Standard queue service.'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? 'text-brand-600' : 'text-slate-500'}`}>
                        {isSelected ? '✓ Selected' : 'Click to Select'}
                      </span>
                      {srv.appointmentEnabled && (
                        <Link
                          to={`/appointment/${srv._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-indigo-600 font-semibold hover:underline"
                        >
                          Book Appointment ➜
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Customer Details Form */}
        {selectedService && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-brand-600" />
              <span>3. Customer Contact Details</span>
            </h3>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerateToken} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 555-0199"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              {selectedService.priorityEnabled && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Priority Category</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  >
                    <option value="NORMAL">Normal Queue</option>
                    <option value="SENIOR_CITIZEN">Senior Citizen (Priority Access)</option>
                    <option value="EMERGENCY">Emergency (Immediate Access)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-base rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-6"
              >
                <span>{generating ? 'Generating Token...' : `GET TOKEN (${selectedService.prefix})`}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
