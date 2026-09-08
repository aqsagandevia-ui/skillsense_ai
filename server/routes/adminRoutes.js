const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const validate = require('../middleware/validate');
const admin = require('../controllers/adminController');

router.use(auth, requireRole('admin'));

router.get('/dashboard', admin.getDashboardStats);
router.get('/users', admin.listUsers);
router.get('/users/:id', admin.getUser);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

// send email to a user
router.post('/users/:id/email', admin.sendEmailToUser);

// reviews
router.get('/reviews', admin.listReviews);
router.get('/reports', admin.getReviewAnalytics);

router.get('/sessions', admin.listSessions);
router.put('/sessions/:id/cancel', admin.forceCancelSession);

// Skills management
router.get('/skills', admin.listSkills);
router.delete('/skills/:id', admin.deleteSkill);

// Settings management
router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

module.exports = router;
