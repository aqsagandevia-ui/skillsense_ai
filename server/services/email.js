const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || pass === 'your-app-password') {
    console.warn('Email not configured - using noop transporter');
    transporter = {
      sendMail: async (opts) => {
        console.log('NOOP sendMail called:', opts);
        return { accepted: [opts.to], response: 'NOOP' };
      }
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user, pass }
  });

  // attempt to verify once
  transporter.verify().then(() => {
    console.log('✅ SMTP transporter verified');
  }).catch(err => {
    console.warn('⚠️ SMTP verify failed:', err.message);
  });

  return transporter;
};

exports.sendMail = async ({ to, subject, html, text, from }) => {
  const t = getTransporter();
  const mail = {
    from: from || (process.env.EMAIL_FROM || 'SkillSwap <noreply@skillswap.com>'),
    to,
    subject,
    html,
    text
  };
  return t.sendMail(mail);
};
