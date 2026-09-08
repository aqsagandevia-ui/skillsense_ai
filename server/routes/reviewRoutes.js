const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const reviewController = require('../controllers/reviewController');

router.post('/', auth, requireRole('learner'), reviewController.createReview);
router.get('/me', auth, reviewController.getMyReviews);
router.get('/mentor/:mentorId', auth, reviewController.getMentorReviews);
router.get('/session/:sessionId', auth, reviewController.getSessionReview);
router.put('/:id', auth, requireRole('learner'), reviewController.editReview);
router.delete('/:id', auth, requireRole('admin'), reviewController.deleteReview);
router.get('/stats/:mentorId', auth, reviewController.getMentorStats);

module.exports = router;
