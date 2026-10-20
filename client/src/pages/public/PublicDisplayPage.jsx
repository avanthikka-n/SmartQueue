import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api.js';
import { Monitor, Volume2, Clock, Building2, Users } from 'lucide-react';

export default function PublicDisplayPage() {
  const { organizationId, departmentId } = useParams();

  const [organization, setOrganization] = useState(null);
  const [department, setDepartment] = useState(null);
  const [currentlyServing, setCurrentlyServing] = useState([]);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Live clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDisplayData = async () => {
    try {
      const [orgRes, deptRes, queueRes] = await Promise.all([
        api.get(`/api/organizations/${organizationId}`),
        api.get('/api/departments', { params: { organizationId } }),
        api.get('/api/queue', { params: { organizationId, departmentId } })
      ]);

      setOrganization(orgRes.data.organization);
      const currentDept = deptRes.data.departments.find(d => d._id === departmentId);
      setDepartment(currentDept);

      setCurrentlyServing(queueRes.data.currentlyServing || []);
      setWaitingQueue(queueRes.data.waitingQueue || []);
    } catch (err) {
      console.error('Error loading public display data:', err);
    }
  };

  useEffect(() => {
    fetchDisplayData();

    // Socket.IO Room Connection
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_organization', organizationId);
    socket.emit('join_department', departmentId);

    const handleUpdate = (payload) => {
      fetchDisplayData();

      // Trigger Text-to-Speech if a new token was called
      if (payload?.token && speechEnabled && 'speechSynthesis' in window) {
        const tokenNum = payload.token.tokenNumber;
        const counterNum = payload.counterNumber || payload.token.counterId?.counterNumber || '';
        const msg = `Token ${tokenNum}, please proceed to Counter ${counterNum}`;
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    };

    socket.on('token_called', handleUpdate);
    socket.on('service_started', fetchDisplayData);
    socket.on('service_completed', fetchDisplayData);
    socket.on('token_skipped', fetchDisplayData);

    return () => {
      socket.disconnect();
    };
  }, [organizationId, departmentId, speechEnabled]);

  const primaryServing = currentlyServing[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg">
            SQ
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              {organization?.name || 'SmartQueue Facility'}
            </h1>
            <p className="text-sm font-semibold text-brand-400">
              Department: {department?.name || 'Main Hall'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl border transition flex items-center space-x-2 text-xs font-bold ${
              speechEnabled ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice Audio: {speechEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-slate-200">{currentTime}</div>
            <div className="text-xs text-slate-400">Live TV Monitor</div>
          </div>
        </div>
      </header>

      {/* Main TV Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 flex-1">
        {/* Left Column: NOW SERVING (Huge TV Callout) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/80 rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <span className="px-4 py-1.5 rounded-full bg-brand-500/20 text-brand-300 font-extrabold text-sm uppercase tracking-widest border border-brand-500/30 inline-block mb-4">
              NOW SERVING
            </span>

            {primaryServing ? (
              <div className="mt-4 space-y-6">
                <div className="text-center py-6">
                  <div className="text-8xl sm:text-9xl font-black text-white font-mono tracking-tight text-shadow-lg">
                    {primaryServing.tokenNumber}
                  </div>
                  <div className="mt-6 text-3xl sm:text-4xl font-extrabold text-brand-400 tracking-tight">
                    PROCEED TO COUNTER {primaryServing.counterId?.counterNumber || primaryServing.counterNumber || '1'}
                  </div>
                  <p className="text-sm text-slate-400 mt-2 font-medium">
                    Service: {primaryServing.serviceId?.name || 'General'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl font-black text-slate-700 font-mono">— — —</div>
                <p className="text-xl font-bold text-slate-400 mt-4">Counter Ready for Next Customer</p>
              </div>
            )}
          </div>

          {/* Secondary Serving Tokens */}
          {currentlyServing.length > 1 && (
            <div className="pt-6 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Other Counters Currently Serving</span>
              <div className="grid grid-cols-3 gap-3">
                {currentlyServing.slice(1, 4).map((srv) => (
                  <div key={srv._id} className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 text-center">
                    <div className="font-mono font-bold text-xl text-white">{srv.tokenNumber}</div>
                    <div className="text-xs text-brand-300 font-semibold mt-0.5">Counter {srv.counterId?.counterNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: UPCOMING QUEUE TOKENS */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center space-x-2">
                <Users className="w-5 h-5 text-brand-400" />
                <span>NEXT TOKENS IN QUEUE</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                Waiting: {waitingQueue.length}
              </span>
            </div>

            {waitingQueue.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <p className="font-semibold text-slate-400 text-base">Queue is Empty</p>
                <p className="text-xs mt-1 text-slate-600">No waiting tokens in this department.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[480px] overflow-y-auto">
                {waitingQueue.slice(0, 8).map((token, idx) => (
                  <div
                    key={token._id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                      idx === 0
                        ? 'bg-slate-800 border-brand-500/50 shadow-md ring-1 ring-brand-500/30'
                        : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-2xl text-white">{token.tokenNumber}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">
                        {token.serviceId?.name || 'Service'}
                      </div>
                    </div>
                    {token.priority !== 'NORMAL' && (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
                        {token.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
            SmartQueue Live Display &bull; Audio Announcements Active
          </div>
        </div>
      </div>
    </div>
  );
}
