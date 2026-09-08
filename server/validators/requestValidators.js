const { body } = require('express-validator');

exports.createRequest = [
  body('mentorId').notEmpty().withMessage('mentorId is required'),
  body('skillId').notEmpty().withMessage('skillId is required'),
  body('message').optional().isString().isLength({ max: 500 }).withMessage('Message too long'),
];
