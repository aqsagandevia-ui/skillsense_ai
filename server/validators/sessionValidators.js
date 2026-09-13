const { body } = require('express-validator');

exports.scheduleSession = [
  // sessionId may be passed as param (/:id) or in body; controller will use params when available
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date'),
  body('time').notEmpty().withMessage('Time is required').matches(/^([01]?\d|2[0-3]):([0-5]\d)$/).withMessage('Time must be HH:MM'),
  body('duration').notEmpty().withMessage('Duration is required').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
  body('meetingLink').optional().isURL().withMessage('meetingLink must be a valid URL'),
  body('note').optional().isString().trim().isLength({ max: 1000 }).withMessage('Note too long'),
  body('learners').optional().isArray({ min: 1 }).withMessage('learners must be an array of learner IDs'),
  body('learners.*').optional().isString().withMessage('Each learner id must be a string')
];
