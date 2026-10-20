import Feedback from '../models/Feedback.js';
import Token from '../models/Token.js';

// @desc    Submit customer feedback
// @route   POST /api/feedback
// @access  Public
export const submitFeedback = async (req, res) => {
  try {
    const { tokenId, rating, comment, customerName } = req.body;

    if (!tokenId || !rating) {
      return res.status(400).json({ success: false, message: 'Token ID and rating are required' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const feedback = await Feedback.create({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      serviceId: token.serviceId,
      tokenId: token._id,
      customerName: customerName || token.customerName || 'Anonymous',
      rating: Number(rating),
      comment: comment || ''
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting feedback'
    });
  }
};

// @desc    Get feedback list & ratings analytics
// @route   GET /api/feedback
// @access  Private (ADMIN, SUPER_ADMIN)
export const getFeedback = async (req, res) => {
  try {
    const organizationId = req.query.organizationId || req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    const feedbackList = await Feedback.find({ organizationId })
      .populate('departmentId', 'name')
      .populate('serviceId', 'name')
      .populate('tokenId', 'tokenNumber')
      .sort({ createdAt: -1 });

    const totalRatings = feedbackList.length;
    const avgRating = totalRatings > 0
      ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / totalRatings).toFixed(1)
      : '5.0';

    res.status(200).json({
      success: true,
      count: totalRatings,
      averageRating: Number(avgRating),
      feedback: feedbackList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching feedback'
    });
  }
};
