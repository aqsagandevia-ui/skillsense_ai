const { body } = require('express-validator');

exports.scheduleSession = [
  // sessionId may be passed as param (/:id) or in body; controller will use params when available
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date'),
  body('time').notEmpty().withMessage('Time is required').matches(/^([01]?\d|2[0-3]):([0-5]\d)$/).withMessage('Time must be HH:MM'),
  body('meetingLink').optional().isURL().withMessage('meetingLink must be a valid URL'),
  body('note').optional().isString().trim().isLength({ max: 1000 }).withMessage('Note too long')
];
