import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api.js';
import { Users, Clock, Monitor, Bell, CheckCircle2, ArrowRight, Shield, AlertCircle, RotateCcw } from 'lucide-react';

export default function TokenStatusPage() {
  const { id: tokenId } = useParams();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [announced, setAnnounced] = useState(false);
  const [proximityAnnounced, setProximityAnnounced] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rejoining, setRejoining] = useState(false);

  const fetchTokenStatus = async () => {
    try {
      const res = await api.get(`/api/tokens/${tokenId}`);
      if (res.data.success) {
        setTokenData(res.data);
      }
    } catch (err) {
      console.error('Error loading token status:', err);
      setError(err.response?.data?.message || 'Token not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenStatus();

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_token', tokenId);

    const handleSocketUpdate = () => {
      fetchTokenStatus();
    };

    socket.on('token_called', handleSocketUpdate);
    socket.on('token_recalled', handleSocketUpdate);
    socket.on('service_started', handleSocketUpdate);
    socket.on('service_completed', handleSocketUpdate);
    socket.on('token_skipped', handleSocketUpdate);
    socket.on('token_cancelled', handleSocketUpdate);

    return () => {
      socket.disconnect();
    };
  }, [tokenId]);

  // Audio / Speech notification when status becomes CALLED
  useEffect(() => {
    if (tokenData?.token?.status === 'CALLED' && !announced) {
      setAnnounced(true);
      if ('speechSynthesis' in window) {
        const announcement = new SpeechSynthesisUtterance(
          `Token ${tokenData.token.tokenNumber}, please proceed to Counter ${tokenData.counterNumber}`
        );
        window.speechSynthesis.speak(announcement);
      }
    }
  }, [tokenData, announced]);

  // Proximity Alert (2-3 away)
  useEffect(() => {
    if (
      tokenData?.token?.status === 'WAITING' &&
      tokenData?.peopleAhead > 0 &&
      tokenData?.peopleAhead <= 3 &&
      !proximityAnnounced
    ) {
      setProximityAnnounced(true);
      if ('speechSynthesis' in window) {
        const announcement = new SpeechSynthesisUtterance(
          `Attention, Token ${tokenData.token.tokenNumber}. Your turn is approaching. ${tokenData.peopleAhead} people ahead.`
        );
        window.speechSynthesis.speak(announcement);
      }
    }
  }, [tokenData, proximityAnnounced]);

  const handleCancelToken = async () => {
    if (!tokenData?.token?._id) return;
    if (!window.confirm(`Are you sure you want to cancel Token ${tokenData.token.tokenNumber}?`)) return;

    setCancelling(true);
    try {
      await api.post(`/api/tokens/${tokenData.token._id}/cancel`);
      fetchTokenStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel token');
    } finally {
      setCancelling(false);
    }
  };

  const handleRejoinQueue = async () => {
    if (!tokenData?.token) return;
    setRejoining(true);
    try {
      const payload = {
        organizationId: tokenData.token.organizationId?._id || tokenData.token.organizationId,
        departmentId: tokenData.token.departmentId?._id || tokenData.token.departmentId,
        serviceId: tokenData.token.serviceId?._id || tokenData.token.serviceId,
        customerName: tokenData.token.customerName,
        customerPhone: tokenData.token.customerPhone,
        priority: tokenData.token.priority || 'NORMAL'
      };

      const res = await api.post('/api/tokens', payload);
      if (res.data.success && res.data.token?._id) {
        navigate(`/token/${res.data.token._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rejoin queue');
    } finally {
      setRejoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Token Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">{error || 'Invalid token link.'}</p>
          <Link to="/organizations" className="inline-block mt-6 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl">
            Browse Organizations
          </Link>
        </div>
      </div>
    );
  }

  const { token, peopleAhead, estimatedWaitTime, currentlyServingToken, counterNumber } = tokenData;
  const isCalled = token.status === 'CALLED';
  const isInService = token.status === 'IN_SERVICE' || token.status === 'SERVING';
  const isCompleted = token.status === 'COMPLETED';
  const isSkipped = token.status === 'SKIPPED';
  const isCancelled = token.status === 'CANCELLED';
  const isNearTurn = token.status === 'WAITING' && peopleAhead > 0 && peopleAhead <= 3;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base">
              SQ
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Smart<span className="text-brand-600">Queue</span></span>
          </Link>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            Live Ticket
          </span>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-4 py-6 flex-1 space-y-4">
        {/* CALLED Big Banner Alert */}
        {isCalled && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl animate-bounce text-center">
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-extrabold uppercase tracking-widest">
              YOUR TOKEN IS CALLED!
            </span>
            <h2 className="text-3xl font-black mt-3">
              TOKEN {token.tokenNumber}
            </h2>
            <p className="text-xl font-bold mt-2 text-amber-100">
              PLEASE PROCEED TO COUNTER {counterNumber}
            </p>
          </div>
        )}

        {/* Proximity Notice: 2-3 Turns Away */}
        {isNearTurn && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-3 shadow-sm">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-sm">Your Turn is Approaching!</p>
              <p className="text-amber-700 mt-0.5">
                Only {peopleAhead} customer{peopleAhead > 1 ? 's' : ''} ahead of you. Please head towards the counter area.
              </p>
            </div>
          </div>
        )}

        {/* Skipped Notice */}
        {isSkipped && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <p className="font-bold text-sm flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Token Skipped (No-Show)</span>
            </p>
            <p className="text-rose-700">
              You did not arrive within the call window. Click below to rejoin the back of the queue.
            </p>
          </div>
        )}

        {/* Main Token Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
            <span className="font-semibold text-slate-500">{token.organizationId?.name}</span>
            <span className={`px-2.5 py-0.5 font-bold rounded-full uppercase ${
              isCompleted ? 'bg-emerald-100 text-emerald-800' :
              isInService ? 'bg-blue-100 text-blue-800' :
              isCalled ? 'bg-amber-100 text-amber-800 animate-pulse' :
              isSkipped ? 'bg-rose-100 text-rose-800' :
              isCancelled ? 'bg-slate-100 text-slate-600' :
              'bg-slate-100 text-slate-700'
            }`}>
              {token.status}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Your Token Number</span>
            <div className="text-6xl font-black text-slate-900 tracking-tight font-mono">
              {token.tokenNumber}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {token.serviceId?.name} ({token.departmentId?.name})
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <Users className="w-5 h-5 text-brand-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">People Ahead</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{peopleAhead}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Wait Time</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{estimatedWaitTime} <span className="text-xs font-normal">mins</span></p>
            </div>
          </div>

          {/* Live Serving Banner */}
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-center justify-between text-xs text-brand-900">
            <div>
              <span className="text-slate-500 font-medium">Currently Serving:</span>
              <span className="ml-1.5 font-extrabold text-brand-700 text-sm font-mono">{currentlyServingToken || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Counter:</span>
              <span className="ml-1.5 font-extrabold text-brand-700 text-sm">{counterNumber || '—'}</span>
            </div>
          </div>

          {/* Cancel Token if still WAITING */}
          {token.status === 'WAITING' && (
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleCancelToken}
                disabled={cancelling}
                className="w-full py-2.5 px-4 border border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling Token...' : 'Cancel This Token'}
              </button>
            </div>
          )}

          {/* Rejoin Queue if Skipped or Cancelled */}
          {(isSkipped || isCancelled) && (
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleRejoinQueue}
                disabled={rejoining}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{rejoining ? 'Rejoining...' : 'Rejoin Queue (Get New Token)'}</span>
              </button>
            </div>
          )}

          {/* Feedback Section if Completed */}
          {isCompleted && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-600 font-semibold mb-3">Service Complete! How was your experience?</p>
              <Link
                to={`/feedback/${token._id}`}
                className="inline-block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Submit Feedback ⭐
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
