require('dotenv').config();
const { sendMail } = require('../services/email');

async function run() {
  try {
    console.log('Using EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    const res = await sendMail({ to: 'admin.auto@example.com', subject: 'Test Email from SkillSwap', html: '<p>This is a test email from SkillSwap</p>' });
    console.log('sendMail result:', res);
  } catch (err) {
    console.error('sendMail error:', err && err.message ? err.message : err);
  }
}

run();
