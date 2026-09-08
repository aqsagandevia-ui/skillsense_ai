const User = require('../models/User');
const Session = require('../models/Session');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');
const Review = require('../models/Review');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalLearners = await User.countDocuments({ role: 'learner' });
    const totalSessions = await Session.countDocuments();
    const pendingRequests = await SkillRequest.countDocuments({ status: 'pending' });

    const totalSkills = await Skill.countDocuments();
    const completedSessions = await Session.countDocuments({ status: 'completed' });
    const totalReviews = await Review.countDocuments();
    const positiveReviews = await Review.countDocuments({ sentiment: 'positive' });
    const negativeReviews = await Review.countDocuments({ sentiment: 'negative' });
    // average rating across users
    const ratingAgg = await User.aggregate([{ $match: { rating: { $exists: true } } }, { $group: { _id: null, avgRating: { $avg: '$rating' } } }]);
    const averageRating = ratingAgg[0]?.avgRating ? Number(ratingAgg[0].avgRating.toFixed(2)) : 0;

    res.json({ totalUsers, totalMentors, totalLearners, totalSkills, totalSessions, pendingRequests, completedSessions, totalReviews, positiveReviews, negativeReviews, averageRating, revenue: 0 });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const countKeywords = (reviews) => {
  const counts = {};
  reviews.forEach((review) => {
    const keywords = Array.isArray(review.keywords) ? review.keywords : [];
    keywords.forEach((keyword) => {
      const key = keyword.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword.charAt(0).toUpperCase() + keyword.slice(1));
};

exports.getReviewAnalytics = async (req, res) => {
  try {
    const reviews = await Review.find().populate('mentor', 'name').lean();
    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1))
      : 0;
    const ratingDistribution = Array.from({ length: 5 }, (_, index) => ({
      rating: index + 1,
      count: reviews.filter((review) => review.rating === index + 1).length,
    }));
    const sentimentDistribution = {
      positive: reviews.filter((review) => review.sentiment === 'positive').length,
      negative: reviews.filter((review) => review.sentiment === 'negative').length,
      neutral: reviews.filter((review) => review.sentiment === 'neutral').length,
    };
    const positiveReviewPercentage = totalReviews ? Number(((sentimentDistribution.positive / totalReviews) * 100).toFixed(1)) : 0;
    const negativeReviewPercentage = totalReviews ? Number(((sentimentDistribution.negative / totalReviews) * 100).toFixed(1)) : 0;

    const now = new Date();
    const monthlyLabels = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const monthlyReviews = monthlyLabels.map((label) => ({ label, count: 0 }));

    const mentorMap = {};
    const keywordCounts = {};
    const positiveKeywordCounts = {};
    const negativeKeywordCounts = {};

    reviews.forEach((review) => {
      const createdAt = new Date(review.createdAt);
      const label = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      const entry = monthlyReviews.find((item) => item.label === label);
      if (entry) entry.count += 1;

      const mentorId = review.mentor?._id?.toString();
      if (mentorId) {
        mentorMap[mentorId] = mentorMap[mentorId] || {
          _id: mentorId,
          name: review.mentor?.name || 'Unknown',
          reviewCount: 0,
          totalRating: 0,
          positiveCount: 0,
        };
        mentorMap[mentorId].reviewCount += 1;
        mentorMap[mentorId].totalRating += review.rating;
        if (review.rating >= 4) mentorMap[mentorId].positiveCount += 1;
      }

      const keywords = Array.isArray(review.keywords) ? review.keywords : [];
      keywords.forEach((keyword) => {
        const key = keyword.toLowerCase();
        keywordCounts[key] = (keywordCounts[key] || 0) + 1;
        if (review.rating >= 4) positiveKeywordCounts[key] = (positiveKeywordCounts[key] || 0) + 1;
        if (review.rating <= 2) negativeKeywordCounts[key] = (negativeKeywordCounts[key] || 0) + 1;
      });
    });

    const topMentors = Object.values(mentorMap)
      .map((mentor) => ({
        _id: mentor._id,
        name: mentor.name,
        reviewCount: mentor.reviewCount,
        averageRating: Number((mentor.totalRating / mentor.reviewCount).toFixed(1)),
        positiveReviewRate: Number(((mentor.positiveCount / mentor.reviewCount) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 6);

    const topStrengths = countKeywords(reviews.filter((review) => review.rating >= 4));
    const areasOfImprovement = countKeywords(reviews.filter((review) => review.rating <= 2));
    const frequentlyMentionedSkills = countKeywords(reviews);
    const overallSummary = totalReviews === 0
      ? 'No reviews have been submitted yet.'
      : positiveReviewPercentage >= negativeReviewPercentage
        ? `Most learners appreciate mentor communication and expertise, with ${positiveReviewPercentage}% positive feedback.`
        : `Learners are requesting improvements in areas such as ${areasOfImprovement.slice(0, 3).join(', ')}.`;

    res.json({
      totalReviews,
      averageRating,
      ratingDistribution,
      sentimentDistribution,
      monthlyReviews,
      topMentors,
      topStrengths,
      areasOfImprovement,
      frequentlyMentionedSkills,
      positiveReviewPercentage,
      negativeReviewPercentage,
      overallSummary,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const q = {};
    if (role) q.role = role;
    if (search) q.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const users = await User.find(q).select('-password -googleTokens').skip((page-1)*limit).limit(parseInt(limit)).sort({ createdAt: -1 });
    const total = await User.countDocuments(q);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -googleTokens');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.isBlocked !== 'undefined') updates.isBlocked = !!req.body.isBlocked;
    if (req.body.role) updates.role = req.body.role;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password -googleTokens');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User updated', user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.listSessions = async (req, res) => {
  try {
    const { status, page = 1, limit = 50, search, mentorId } = req.query;
    const q = {};

    if (status && status !== 'all') q.status = status;
    if (mentorId && mentorId !== 'all') q.mentor = mentorId;

    const allSessions = await Session.find(q)
      .populate('learner mentor', 'name email photo')
      .populate('skillTopic', 'skillName')
      .sort({ createdAt: -1 });

    let filteredSessions = allSessions;
    if (search) {
      const term = search.toLowerCase();
      filteredSessions = allSessions.filter((session) => {
        const learnerName = session.learner?.name?.toLowerCase() || '';
        const mentorName = session.mentor?.name?.toLowerCase() || '';
        const skillName = session.skillTopic?.skillName?.toLowerCase() || '';
        const statusName = session.status?.toLowerCase() || '';
        const messageText = `${session.message || ''} ${session.meetingLink || ''}`.toLowerCase();

        return [learnerName, mentorName, skillName, statusName, messageText].some((value) => value.includes(term));
      });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 50);
    const skip = (pageNum - 1) * limitNum;
    const pagedSessions = filteredSessions.slice(skip, skip + limitNum);

    res.json({ sessions: pagedSessions, total: filteredSessions.length });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.forceCancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    session.status = 'cancelled';
    await session.save();
    res.json({ msg: 'Session cancelled', session });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: list all skills with optional filters
exports.listSkills = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const q = {};
    if (category) q.category = category;
    if (search) q.skillName = { $regex: search, $options: 'i' };

    const total = await Skill.countDocuments(q);
    const skills = await Skill.find(q).populate('user', 'name email photo').skip((page-1)*limit).limit(parseInt(limit)).sort({ createdAt: -1 });
    res.json({ skills, total });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: delete any skill
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ msg: 'Skill not found' });
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: get settings
exports.getSettings = async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    const settings = await Setting.find().lean();
    const result = {};
    settings.forEach(s => result[s.key] = s.value);
    res.json({ settings: result });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: update settings (upsert)
exports.updateSettings = async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    const updates = req.body || {};
    const keys = Object.keys(updates);
    for (const key of keys) {
      await Setting.findOneAndUpdate({ key }, { value: updates[key] }, { upsert: true, new: true });
    }
    const settings = await Setting.find().lean();
    const result = {};
    settings.forEach(s => result[s.key] = s.value);
    res.json({ settings: result });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Send arbitrary email to a user (admin only)
exports.sendEmailToUser = async (req, res) => {
  try {
    const { subject, html, text } = req.body;
    const user = await User.findById(req.params.id).select('email name');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const { sendMail } = require('../services/email');
    await sendMail({ to: user.email, subject, html, text });
    res.json({ msg: 'Email sent' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Aggregate all reviews across users for admin view
exports.listReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('learner', 'name email')
      .populate('mentor', 'name email')
      .populate({ path: 'session', populate: { path: 'skillTopic', select: 'skillName' } })
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
