import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Monitor, LogOut, ArrowRightLeft, Coffee, X } from 'lucide-react';

export default function StaffLayout({
  children,
  currentCounter,
  counterStatus,
  onStatusChange,
  availableCounters = [],
  onSwitchCounter
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Staff Navbar */}
      <header className="bg-slate-900 text-white h-16 px-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-lg">
            SQ
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">SmartQueue Staff Console</span>
            {user?.organizationId && (
              <span className="ml-3 px-2.5 py-0.5 text-xs font-semibold bg-slate-800 text-brand-300 rounded-full border border-slate-700">
                {user.organizationId.name || 'Organization'}
              </span>
            )}
          </div>
        </div>

        {/* Counter Info & Status Selector */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold">
            <Monitor className="w-4 h-4 text-brand-400" />
            <span className="text-slate-300">
              {currentCounter ? `${currentCounter.name} (#${currentCounter.counterNumber})` : 'Desk Unassigned'}
            </span>
            {availableCounters.length > 1 && onSwitchCounter && (
              <button
                onClick={() => setShowSwitchModal(true)}
                className="ml-2 text-[10px] text-brand-400 hover:text-brand-300 underline font-medium"
                title="Switch to another counter"
              >
                Switch
              </button>
            )}
          </div>

          {currentCounter && onStatusChange && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={counterStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
                  counterStatus === 'busy'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : counterStatus === 'break' || counterStatus === 'paused'
                    ? 'bg-orange-500 text-white border-orange-600'
                    : counterStatus === 'available'
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}
              >
                <option value="available">AVAILABLE</option>
                <option value="busy">BUSY</option>
                <option value="break">ON BREAK</option>
                <option value="offline">OFFLINE</option>
              </select>
            </div>
          )}

          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user?.name}</p>
              <p className="text-[10px] text-slate-400">{user?.designation || 'Staff Agent'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Break Mode Banner */}
      {(counterStatus === 'break' || counterStatus === 'paused') && (
        <div className="bg-orange-500 text-white text-xs font-bold px-6 py-2 flex items-center justify-center space-x-2 shadow-inner">
          <Coffee className="w-4 h-4 animate-bounce" />
          <span>Desk is currently ON BREAK / PAUSED. Change status to AVAILABLE when ready to call tokens.</span>
        </div>
      )}

      {/* Switch Counter Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-brand-600" />
                <span>Switch Counter Desk</span>
              </h3>
              <button onClick={() => setShowSwitchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 my-3">
              Select the counter desk you are operating today:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableCounters.map((cnt) => (
                <button
                  key={cnt._id}
                  onClick={() => {
                    onSwitchCounter(cnt);
                    setShowSwitchModal(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition flex items-center justify-between ${
                    currentCounter?._id === cnt._id
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-semibold">{cnt.name}</span>
                    <span className="text-xs text-slate-400 block">
                      {cnt.departmentId?.name || 'Department'} #{cnt.counterNumber}
                    </span>
                  </div>
                  {currentCounter?._id === cnt._id && (
                    <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Staff Container */}
      <main className="p-6 max-w-7xl w-full mx-auto flex-1">
        {children}
      </main>
    </div>
  );
}
