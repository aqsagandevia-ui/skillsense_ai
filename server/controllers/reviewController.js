const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const stopwords = new Set([
  'the','and','for','with','that','this','was','very','were','had','but','not','have','has','been','they','them','their','its','are','is','on','in','at','to','of','a','an','it','as','so','if','be','by','or','from','your','you','we','my','me','our','us','can','will','would','could','should','just','too','also','session','mentor','learner','review','feedback','course','learn','learning'
]);

const buildReviewProjection = () => ({
  learner: 1,
  mentor: 1,
  session: 1,
  rating: 1,
  comment: 1,
  sentiment: 1,
  sentimentScore: 1,
  keywords: 1,
  editCount: 1,
  createdAt: 1,
  updatedAt: 1,
});

const normalizeKeyword = (value) => value.trim().replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9 ]/g, '').trim();

const extractKeywords = (comment) => {
  if (!comment) return [];
  const phraseMatches = comment.match(/\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)\b/g) || [];
  const keywordSet = new Map();

  phraseMatches.forEach((phrase) => {
    const normalized = normalizeKeyword(phrase);
    if (normalized && !stopwords.has(normalized.toLowerCase())) {
      keywordSet.set(normalized.toLowerCase(), normalized);
    }
  });

  const words = comment
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));

  const counts = {};
  words.forEach((word) => {
    counts[word] = (counts[word] || 0) + 1;
  });

  const wordKeywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  const combined = [...keywordSet.values(), ...wordKeywords];
  return [...new Set(combined)].slice(0, 5);
};

const analyzeReviewComment = (comment) => {
  const analysis = sentiment.analyze(comment || '');
  const score = Number(analysis.score.toFixed(2));
  const sentimentLabel = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
  return {
    sentiment: sentimentLabel,
    sentimentScore: score,
    keywords: extractKeywords(comment),
  };
};

const sortKeywords = (counts) => Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([value]) => value.charAt(0).toUpperCase() + value.slice(1));

const calculateMentorScore = (averageRating, totalSessions, positiveReviewPercentage, skillMentions) => {
  const normalizedSessions = Math.min(totalSessions, 20) / 20 * 5;
  const normalizedSkillMentions = Math.min(skillMentions, 10) / 10 * 5;
  const normalizedPositive = (positiveReviewPercentage / 100) * 5;
  return Number((averageRating * 0.4 + normalizedSessions * 0.2 + normalizedPositive * 0.2 + normalizedSkillMentions * 0.2).toFixed(2));
};

const buildReviewInsights = (reviews) => {
  const total = reviews.length;
  const positiveCount = reviews.filter((r) => r.rating >= 4).length;
  const negativeCount = reviews.filter((r) => r.rating <= 2).length;
  const positiveReviewPercentage = total ? Number(((positiveCount / total) * 100).toFixed(1)) : 0;
  const negativeReviewPercentage = total ? Number(((negativeCount / total) * 100).toFixed(1)) : 0;

  const keywordCounts = {};
  const positiveKeywordCounts = {};
  const negativeKeywordCounts = {};

  reviews.forEach((review) => {
    const keywords = Array.isArray(review.keywords) ? review.keywords : [];
    keywords.forEach((keyword) => {
      const key = keyword.toLowerCase();
      keywordCounts[key] = (keywordCounts[key] || 0) + 1;
      if (review.rating >= 4) {
        positiveKeywordCounts[key] = (positiveKeywordCounts[key] || 0) + 1;
      }
      if (review.rating <= 2) {
        negativeKeywordCounts[key] = (negativeKeywordCounts[key] || 0) + 1;
      }
    });
  });

  const frequentlyMentionedSkills = sortKeywords(keywordCounts);
  const topStrengths = sortKeywords(positiveKeywordCounts);
  const areasOfImprovement = sortKeywords(negativeKeywordCounts);

  const summaryKeywords = frequentlyMentionedSkills.slice(0, 2);
  const reviewSummary = total === 0
    ? 'No reviews yet for this mentor.'
    : positiveCount >= negativeCount
      ? `Most learners appreciate your ${summaryKeywords.length > 0 ? summaryKeywords.join(' and ') : 'mentoring'} and communication skills.`
      : `Learners often request improvements around ${areasOfImprovement.length > 0 ? areasOfImprovement.join(', ') : 'clarity and pacing'}.`;

  return {
    totalReviews: total,
    positiveReviewPercentage,
    negativeReviewPercentage,
    topStrengths: topStrengths.length ? topStrengths : ['Communication', 'Clarity'],
    frequentlyMentionedSkills: frequentlyMentionedSkills.length ? frequentlyMentionedSkills : ['Communication'],
    areasOfImprovement: areasOfImprovement.length ? areasOfImprovement : ['Clarity'],
    reviewSummary,
  };
};

const updateMentorReviewMetrics = async (mentorId) => {
  const reviews = await Review.find({ mentor: mentorId }).lean();
  const totalSessions = reviews.length;
  const averageRating = totalSessions
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalSessions).toFixed(1))
    : 0;
  const insights = buildReviewInsights(reviews);
  const mentorScore = calculateMentorScore(averageRating, totalSessions, insights.positiveReviewPercentage, insights.frequentlyMentionedSkills.length);

  await User.findByIdAndUpdate(mentorId, {
    rating: averageRating,
    reviewSummary: insights.reviewSummary,
    reviewInsights: insights,
    mentorScore,
  });
};

exports.createReview = async (req, res) => {
  try {
    const learnerId = req.user.id;
    const { sessionId, rating, comment } = req.body;

    if (!sessionId) {
      return res.status(400).json({ msg: 'sessionId is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.learner.toString() !== learnerId) {
      return res.status(403).json({ msg: 'Only the learner who attended the session can submit a review' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({ msg: 'Reviews can only be submitted for completed sessions' });
    }

    const existing = await Review.findOne({ session: sessionId });
    if (existing) {
      return res.status(409).json({ msg: 'A review already exists for this session. Use edit if needed.' });
    }

    const { sentiment, sentimentScore, keywords } = analyzeReviewComment(comment);
    const review = await Review.create({
      session: session._id,
      mentor: session.mentor,
      learner: session.learner,
      rating,
      comment: comment?.trim() || '',
      sentiment,
      sentimentScore,
      keywords
    });

    await updateMentorReviewMetrics(session.mentor);

    const learner = await User.findById(learnerId);
    const mentor = await User.findById(session.mentor);
    if (mentor) {
      const io = require('../socket').getIO();
      if (io) {
        io.to(`user_${mentor._id}`).emit('new_review_notification', {
          message: `You received a new ${rating}-star review from ${learner?.name || 'a learner'}.`,
          reviewId: review._id,
          mentorId: mentor._id,
        });
      }
    }

    const populated = await Review.findById(review._id)
      .select(buildReviewProjection())
      .populate('learner', 'name photo')
      .populate({ path: 'session', populate: { path: 'skillTopic', select: 'skillName' } });

    res.status(201).json({ review: populated });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getMentorReviews = async (req, res) => {
  try {
    let { mentorId } = req.params;
    if (mentorId === 'me') mentorId = req.user.id;
    const ratingFilter = req.query.rating ? Number(req.query.rating) : null;

    const filter = {
      mentor: mentorId
    };

    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      filter.rating = ratingFilter;
    }

    const reviews = await Review.find(filter)
      .select(buildReviewProjection())
      .populate('learner', 'name photo')
      .populate({ path: 'session', populate: { path: 'skillTopic', select: 'skillName' } })
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getSessionReview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const review = await Review.findOne({ session: sessionId })
      .select(buildReviewProjection())
      .populate('learner', 'name photo')
      .populate({ path: 'session', populate: { path: 'skillTopic', select: 'skillName' } });

    if (!review) {
      return res.status(404).json({ msg: 'Review not found for this session' });
    }

    res.json({ review });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.editReview = async (req, res) => {
  try {
    const learnerId = req.user.id;
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    if (review.learner.toString() !== learnerId) {
      return res.status(403).json({ msg: 'Only the reviewer may edit this review' });
    }

    if (review.editCount >= 1) {
      return res.status(400).json({ msg: 'Reviews can only be edited once' });
    }

    const { sentiment, sentimentScore, keywords } = analyzeReviewComment(comment);
    review.rating = rating;
    review.comment = comment?.trim() || '';
    review.sentiment = sentiment;
    review.sentimentScore = sentimentScore;
    review.keywords = keywords;
    review.editCount += 1;
    await review.save();

    await updateMentorReviewMetrics(review.mentor);

    const updated = await Review.findById(reviewId)
      .select(buildReviewProjection())
      .populate('learner', 'name photo')
      .populate({ path: 'session', populate: { path: 'skillTopic', select: 'skillName' } });

    res.json({ review: updated });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    const mentorId = review.mentor;
    await review.remove();

    if (mentorId) {
      await updateMentorReviewMetrics(mentorId);
    }

    res.json({ msg: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getMentorStats = async (req, res) => {
  try {
    let { mentorId } = req.params;
    if (mentorId === 'me') mentorId = req.user.id;
    const reviews = await Review.find({ mentor: mentorId });

    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const ratingDistribution = Array.from({ length: 5 }, (_, index) => {
      const ratingValue = index + 1;
      return {
        rating: ratingValue,
        count: reviews.filter((review) => review.rating === ratingValue).length
      };
    });

    const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
    const negativeReviews = reviews.filter((r) => r.rating <= 2).length;

    res.json({
      averageRating,
      totalReviews,
      ratingDistribution,
      positiveReviews,
      negativeReviews
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const learnerId = req.user.id;
    const reviews = await Review.find({ learner: learnerId })
      .select(buildReviewProjection())
      .populate('mentor', 'name photo')
      .populate({ path: 'session', populate: { path: 'skillTopic', select: 'skillName' } })
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
