import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';
import { Building2, Search, ArrowRight, MapPin, Phone, Shield, Filter } from 'lucide-react';

export default function OrganizationSelectorPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/organizations', {
          params: { search, type: selectedType }
        });
        setOrganizations(res.data.organizations);
      } catch (err) {
        console.error('Failed to fetch organizations', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, [search, selectedType]);

  const orgTypes = [
    { label: 'All Industries', value: '' },
    { label: 'Hospitals', value: 'hospital' },
    { label: 'Banks', value: 'bank' },
    { label: 'Clinics', value: 'clinic' },
    { label: 'Government', value: 'government' },
    { label: 'Education', value: 'education' },
    { label: 'Hotels', value: 'hotel' },
    { label: 'Salons', value: 'salon' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Title & Filters */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Select Organization</h1>
          <p className="text-slate-600 mt-1">Choose a hospital, bank, or service provider to generate a live token or book an appointment.</p>
          
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organization name..."
                className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
              {orgTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                    selectedType === t.value
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Organizations Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading organizations...</div>
        ) : organizations.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No organizations found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search query or industry filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <div
                key={org._id}
                onClick={() => navigate(`/select-service?organizationId=${org._id}`)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold text-xl uppercase">
                      {org.name.charAt(0)}
                    </div>
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {org.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition">
                    {org.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {org.description || 'Configured SmartQueue tenant facility with live token tracking.'}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    {org.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{org.address}</span>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{org.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition">
                  <span>Get Token / Book Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
