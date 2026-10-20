import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import StaffLayout from '../../layouts/StaffLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import {
  PhoneCall,
  RotateCcw,
  Play,
  CheckCircle2,
  SkipForward,
  ArrowRightLeft,
  Users,
  Clock,
  AlertCircle,
  Check,
  Tag,
  X
} from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [currentCounter, setCurrentCounter] = useState(null);
  const [availableCounters, setAvailableCounters] = useState([]);
  const [counterStatus, setCounterStatus] = useState('offline');
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetServiceId, setTargetServiceId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchQueueData = async () => {
    try {
      if (!user?.organizationId) return;

      const orgId = user.organizationId?._id || user.organizationId;
      const staffDeptId = user.departmentId?._id || user.departmentId;
      const staffCounterId = user.counterId?._id || user.counterId;
      const staffUserId = user._id || user.id;

      const [counterRes, queueRes, servicesRes] = await Promise.all([
        api.get('/api/counters', { params: { organizationId: orgId } }),
        api.get('/api/tokens/queue', { params: { organizationId: orgId } }),
        api.get('/api/services', { params: { organizationId: orgId } })
      ]);

      const allCounters = counterRes.data.counters || [];
      setAvailableCounters(allCounters);

      // Find staff's counter by counterId, assignedStaff, or department
      const myCounter = allCounters.find(
        (c) => (staffCounterId && (c._id === staffCounterId || c._id?.toString() === staffCounterId?.toString())) ||
               c.assignedStaff?.some((s) => (s._id || s)?.toString() === staffUserId?.toString())
      ) || (staffDeptId ? allCounters.find(c => (c.departmentId?._id || c.departmentId)?.toString() === staffDeptId?.toString()) : null)
        || allCounters[0];

      if (myCounter) {
        setCurrentCounter(myCounter);
        setCounterStatus(myCounter.status || 'available');
      }

      const allTokens = queueRes.data.queue || queueRes.data.tokens || [];
      const waiting = queueRes.data.waitingQueue || allTokens.filter(t => t.status === 'WAITING');

      // Filter waiting queue for this department if applicable
      const targetDeptId = myCounter?.departmentId?._id || myCounter?.departmentId || staffDeptId;
      const deptWaiting = targetDeptId
        ? waiting.filter(t => (t.departmentId?._id || t.departmentId)?.toString() === targetDeptId?.toString())
        : waiting;

      setWaitingQueue(deptWaiting.length > 0 ? deptWaiting : waiting);
      setServices(servicesRes.data.services || []);

      // Find token currently CALLED or IN_SERVICE for this counter or staff
      const activeServing = (queueRes.data.currentlyServing || allTokens.filter(t => ['CALLED', 'IN_SERVICE'].includes(t.status)))?.find(
        (t) => (myCounter && (t.counterId?._id || t.counterId)?.toString() === myCounter._id?.toString()) ||
               (t.staffId?._id || t.staffId)?.toString() === staffUserId?.toString()
      );
      setCurrentlyServing(activeServing || null);

    } catch (err) {
      console.error('Error fetching staff queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Initialize Socket.IO connection
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    const orgId = user?.organizationId?._id || user?.organizationId;
    const deptId = user?.departmentId?._id || user?.departmentId;

    if (orgId) socket.emit('join_organization', orgId);
    if (deptId) socket.emit('join_department', deptId);

    // Listen for queue updates
    const handleUpdate = () => {
      fetchQueueData();
    };

    socket.on('token_created', handleUpdate);
    socket.on('token_called', handleUpdate);
    socket.on('token_recalled', handleUpdate);
    socket.on('service_started', handleUpdate);
    socket.on('service_completed', handleUpdate);
    socket.on('token_skipped', handleUpdate);
    socket.on('token_transferred', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleStatusChange = async (newStatus) => {
    if (!currentCounter) return;
    try {
      await api.put(`/api/counters/${currentCounter._id}`, { status: newStatus });
      setCounterStatus(newStatus);
    } catch (err) {
      alert('Failed to update counter status');
    }
  };

  // Staff Actions
  const handleCallNext = async (targetTokenId = null) => {
    setActionError('');
    if (!currentCounter) {
      setActionError('No counter assigned. Please contact your organization admin to assign a counter.');
      return;
    }
    const tokenIdToCall = targetTokenId || waitingQueue[0]?._id;
    if (!tokenIdToCall) {
      setActionError('No tokens currently waiting in queue.');
      return;
    }

    setSubmittingAction(true);
    try {
      await api.post(`/api/tokens/${tokenIdToCall}/call`, {
        counterId: currentCounter._id
      });
      fetchQueueData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to call token');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRecall = async () => {
    if (!currentlyServing) return;
    setSubmittingAction(true);
    try {
      await api.post(`/api/tokens/${currentlyServing._id}/recall`);
      fetchQueueData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to recall token');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleStartService = async () => {
    if (!currentlyServing) return;
    setSubmittingAction(true);
    try {
      await api.post(`/api/tokens/${currentlyServing._id}/start`);
      fetchQueueData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to start service');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCompleteService = async () => {
    if (!currentlyServing) return;
    setSubmittingAction(true);
    try {
      await api.post(`/api/tokens/${currentlyServing._id}/complete`);
      fetchQueueData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to complete service');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSkipToken = async () => {
    if (!currentlyServing) return;
    setSubmittingAction(true);
    try {
      await api.post(`/api/tokens/${currentlyServing._id}/skip`);
      fetchQueueData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to skip token');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!currentlyServing || !targetServiceId) return;
    setSubmittingAction(true);
    try {
      await api.post(`/api/tokens/${currentlyServing._id}/transfer`, {
        targetServiceId,
        notes: transferNotes
      });
      setShowTransferModal(false);
      fetchQueueData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to transfer token');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSwitchCounter = async (newCounter) => {
    try {
      setCurrentCounter(newCounter);
      setCounterStatus(newCounter.status || 'available');
      if (user?._id) {
        await api.put(`/api/staff/${user._id}`, { counterId: newCounter._id });
      }
      fetchQueueData();
    } catch (err) {
      console.error('Failed to update counter assignment:', err);
    }
  };

  return (
    <StaffLayout
      currentCounter={currentCounter}
      counterStatus={counterStatus}
      onStatusChange={handleStatusChange}
      availableCounters={availableCounters}
      onSwitchCounter={handleSwitchCounter}
    >
      <div className="space-y-6">
        {actionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Counter</span>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {currentCounter ? `Counter ${currentCounter.counterNumber}` : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1">{currentCounter?.name || 'Unassigned'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currently Serving</span>
            <div className="text-2xl font-black text-brand-600 mt-2">
              {currentlyServing ? currentlyServing.tokenNumber : 'NONE'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentlyServing ? `Status: ${currentlyServing.status}` : 'Counter Ready'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Token</span>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {waitingQueue[0] ? waitingQueue[0].tokenNumber : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {waitingQueue[0] ? waitingQueue[0].customerName : 'Queue Empty'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waiting Count</span>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {waitingQueue.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Customers waiting</p>
          </div>
        </div>

        {/* Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Active Serving Console */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-slate-900">Active Serving Console</h2>
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                  currentlyServing?.status === 'IN_SERVICE' ? 'bg-emerald-100 text-emerald-800' :
                  currentlyServing?.status === 'CALLED' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {currentlyServing ? currentlyServing.status : 'IDLE'}
                </span>
              </div>

              {currentlyServing ? (
                <div className="space-y-6">
                  {/* Huge Token Display */}
                  <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Serving Token</span>
                    <div className="text-5xl font-black text-brand-600 tracking-tight">
                      {currentlyServing.tokenNumber}
                    </div>
                    <div className="mt-3 flex items-center justify-center space-x-2">
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-white text-slate-700 rounded border border-slate-200">
                        {currentlyServing.serviceId?.name || 'Service'}
                      </span>
                      {currentlyServing.priority !== 'NORMAL' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200 uppercase">
                          {currentlyServing.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Customer Name:</span>
                      <span className="font-semibold text-slate-800">{currentlyServing.customerName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Phone Contact:</span>
                      <span className="font-semibold text-slate-800">{currentlyServing.customerPhone}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {currentlyServing.status === 'CALLED' && (
                      <button
                        onClick={handleStartService}
                        disabled={submittingAction}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center space-x-2 transition"
                      >
                        <Play className="w-5 h-5" />
                        <span>START SERVICE</span>
                      </button>
                    )}

                    {currentlyServing.status === 'IN_SERVICE' && (
                      <button
                        onClick={handleCompleteService}
                        disabled={submittingAction}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center space-x-2 transition"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>COMPLETE SERVICE</span>
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleRecall}
                        disabled={submittingAction}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Recall</span>
                      </button>

                      <button
                        onClick={handleSkipToken}
                        disabled={submittingAction}
                        className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip</span>
                      </button>

                      <button
                        onClick={() => {
                          setTargetServiceId(services[0]?._id || '');
                          setShowTransferModal(true);
                        }}
                        disabled={submittingAction}
                        className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Transfer</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                    SQ
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Counter Available</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    No active token currently serving at this desk. Click "CALL NEXT" to serve waiting customers.
                  </p>
                  <button
                    onClick={() => handleCallNext()}
                    disabled={waitingQueue.length === 0 || submittingAction}
                    className="mt-6 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 mx-auto transition disabled:opacity-50"
                  >
                    <PhoneCall className="w-5 h-5" />
                    <span>CALL NEXT TOKEN</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Waiting Queue List */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-brand-600" />
                  <h2 className="text-lg font-bold text-slate-900">Waiting Queue ({waitingQueue.length})</h2>
                </div>
                <button
                  onClick={() => handleCallNext()}
                  disabled={waitingQueue.length === 0 || submittingAction}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Top Token</span>
                </button>
              </div>

              {waitingQueue.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <p className="font-semibold text-slate-700">No customers waiting in queue.</p>
                  <p className="text-xs mt-1">New tokens generated by customers will appear here in real time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Token #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {waitingQueue.map((t, idx) => (
                        <tr key={t._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.tokenNumber}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 text-xs">{t.customerName}</div>
                            <div className="text-[10px] text-slate-500">{t.customerPhone}</div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">{t.serviceId?.name || 'Service'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                              t.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                              t.priority === 'SENIOR_CITIZEN' ? 'bg-amber-100 text-amber-800' :
                              t.priority === 'APPOINTMENT' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleCallNext(t._id)}
                              disabled={submittingAction}
                              className="px-3 py-1 bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 font-semibold text-xs rounded-lg transition"
                            >
                              Call This
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
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Transfer Customer Token</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Service</label>
                <select
                  required
                  value={targetServiceId}
                  onChange={(e) => setTargetServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.prefix})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transfer Note (Optional)</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Referred to Laboratory for blood test"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm"
                >
                  {submittingAction ? 'Transferring...' : 'Transfer Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
