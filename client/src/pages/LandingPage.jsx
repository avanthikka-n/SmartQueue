import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import {
  Building2,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import api from '../services/api.js';
import axios from 'axios';

export default function LandingPage() {
  const [apiStatus, setApiStatus] = useState({ loading: true, online: false });

  useEffect(() => {
    let isMounted = true;
    api.get('/api/health')
      .then(res => {
        if (isMounted && res.data?.status === 'ok') {
          setApiStatus({ loading: false, online: true });
        } else if (isMounted) {
          setApiStatus({ loading: false, online: false });
        }
      })
      .catch(() => {
        axios.get('/api/health')
          .then(res => {
            if (isMounted && res.data?.status === 'ok') {
              setApiStatus({ loading: false, online: true });
            } else if (isMounted) {
              setApiStatus({ loading: false, online: false });
            }
          })
          .catch(() => {
            if (isMounted) setApiStatus({ loading: false, online: false });
          });
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navigation */}
      <Navbar showApiStatus={true} apiOnline={apiStatus.online} />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Skip the queue. <br />
              <span className="text-brand-600">Save your time.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Book digital queue tokens and track your turn without standing in line. Receive live status updates on your phone and arrive right when it's your turn.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/organizations"
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition text-base"
              >
                <span>Find a Facility</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl transition shadow-sm text-base"
              >
                Register Organization
              </Link>
            </div>
          </div>
        </section>

        {/* 3-Step Simple Explanation */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">How SmartQueue Works</h2>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">Three simple steps to a seamless service experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center relative group hover:border-brand-300 transition">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-5 font-black text-xl">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Select a Service</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Choose your hospital, clinic, bank, or government facility and pick the department or service you need.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center relative group hover:border-brand-300 transition">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-5 font-black text-xl">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Get a Token</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Generate your unique queue token instantly. See your exact position in queue and an estimated waiting time.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center relative group hover:border-brand-300 transition">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-5 font-black text-xl">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Track Your Turn</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Watch live queue updates on your digital ticket. Get notified immediately when your token is called to the counter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Industries & Facility Types */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Serving Multiple Facility Types</h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">Designed for organizations of all sizes</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Building2 className="w-8 h-8 text-brand-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-base">Hospitals & Clinics</h4>
              <p className="text-xs text-slate-500 mt-1">OPD consultations, labs & pharmacies</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Users className="w-8 h-8 text-brand-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-base">Banks & Finance</h4>
              <p className="text-xs text-slate-500 mt-1">Teller windows, accounts & loan desks</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Clock className="w-8 h-8 text-brand-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-base">Government Offices</h4>
              <p className="text-xs text-slate-500 mt-1">Citizen services, licensing & permits</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Smartphone className="w-8 h-8 text-brand-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-base">Service Centers</h4>
              <p className="text-xs text-slate-500 mt-1">Telecom, repairs, salons & spas</p>
            </div>
          </div>
        </section>

        {/* Quick Portal Switcher Banner */}
        <section className="bg-brand-50 border-t border-brand-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Are you a staff operator or organization administrator?</h3>
              <p className="text-sm text-slate-600 mt-1">Log in to operate service counters, call waiting tokens, or manage departments.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/staff/login"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition shadow-sm"
              >
                Staff Portal
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">SmartQueue</span>
            <span>&copy; {new Date().getFullYear()} Universal Token Management System.</span>
          </div>
          <div className="flex items-center space-x-6 font-medium">
            <Link to="/organizations" className="hover:text-brand-600 transition">Find Facility</Link>
            <Link to="/login" className="hover:text-brand-600 transition">Customer Sign In</Link>
            <Link to="/staff/login" className="hover:text-brand-600 transition">Staff Login</Link>
            <Link to="/register" className="hover:text-brand-600 transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
