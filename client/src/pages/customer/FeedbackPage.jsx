import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

const STAR_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent'
};

export default function FeedbackPage() {
  const { tokenId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/feedback', {
        tokenId,
        rating,
        comment: comment.trim(),
        customerName: customerName.trim()
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-500 mb-8">
            Your {rating}-star feedback has been recorded. We appreciate you taking the time to share your experience.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Rate Your Experience</h1>
          <p className="text-slate-500 text-sm mt-1">Your feedback helps us serve you better</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
              How would you rate our service?
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <svg
                    className={`w-12 h-12 transition-colors ${
                      star <= (hovered || rating)
                        ? 'text-yellow-400'
                        : 'text-slate-200'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-center text-sm font-medium text-yellow-600 mt-2">
                {STAR_LABELS[hovered || rating]}
              </p>
            )}
          </div>

          {/* Name (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Your Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Anonymous"
              maxLength={60}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Comments <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your visit — what went well or what we can improve..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <p className="text-right text-xs text-slate-400 mt-1">{comment.length}/500</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
