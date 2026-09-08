// Centralized HTML email templates for SkillSwap

exports.welcomeEmail = ({ name }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px;">
      <h2 style="color:#4F46E5;">Welcome to SkillSwap, ${name}!</h2>
      <p>Thanks for joining SkillSwap — a place to exchange skills, learn, and grow.</p>
      <ul>
        <li>Find mentors and book live sessions.</li>
        <li>Share your skills and earn reputation.</li>
        <li>Track sessions and reviews in your dashboard.</li>
      </ul>
      <p style="margin-top:16px;">Get started by completing your profile and exploring mentors.</p>
      <p style="color:#6B7280; font-size:13px; margin-top:18px;">Regards,<br/>The SkillSwap Team</p>
    </div>
  `;
};

exports.requestAcceptedEmail = ({ learnerName, mentorName, skill }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px;">
      <h3 style="color:#4F46E5;">Request Accepted</h3>
      <p>Hello ${learnerName},</p>
      <p>Your request for <strong>${skill}</strong> has been accepted by <strong>${mentorName}</strong>.</p>
      <p>The mentor will schedule a session soon. You'll receive an email when the session is scheduled.</p>
      <p style="color:#6B7280; font-size:13px; margin-top:18px;">Regards,<br/>SkillSwap Team</p>
    </div>
  `;
};

exports.sessionScheduledEmail = ({ learnerName, mentorName, skill, dateStr, meetingLink }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px;">
      <h3 style="color:#4F46E5;">Session Scheduled</h3>
      <p>Hello ${learnerName},</p>
      <p>Your session with <strong>${mentorName}</strong> has been scheduled.</p>
      <p><strong>Skill:</strong> ${skill}</p>
      <p><strong>Date & Time:</strong> ${dateStr}</p>
      <p style="margin-top:8px;"><strong>Join here:</strong><br/><a href="${meetingLink}" style="color:#4F46E5;">${meetingLink}</a></p>
      <p style="margin-top:12px;">Please join on time. If you need to reschedule, contact your mentor.</p>
      <p style="color:#6B7280; font-size:13px; margin-top:18px;">Regards,<br/>SkillSwap Team</p>
    </div>
  `;
};

exports.sessionScheduledLearner = ({ learnerName, mentorName, skill, dateStr, timeStr, meetingLink, note }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; max-width:680px; background:#f9fafb;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:24px; border-radius:8px; box-shadow:0 4px 16px rgba(15,23,42,0.06); font-family: Arial, sans-serif; color:#0f172a;">
        <h2 style="color:#0f172a; margin-bottom:8px;">Session Scheduled Successfully</h2>
        <p style="color:#475569;">Hello ${learnerName},</p>
        <p style="color:#475569;">Your session has been scheduled with <strong>${mentorName}</strong>.</p>
        <table style="width:100%; margin-top:12px; border-collapse:collapse; font-size:14px; color:#0f172a;">
          <tr><td style="padding:6px 0; width:120px;"><strong>Topic</strong></td><td style="padding:6px 0;">${skill}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Date</strong></td><td style="padding:6px 0;">${dateStr}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Time</strong></td><td style="padding:6px 0;">${timeStr}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Meeting Link</strong></td><td style="padding:6px 0;"><a href="${meetingLink}" style="color:#2563eb">${meetingLink}</a></td></tr>
        </table>
        ${note ? `<div style="margin-top:12px; padding:12px; background:#f1f5f9; border-radius:6px;"><strong>Note from Mentor</strong><p style="margin:6px 0 0 0; color:#334155">${note}</p></div>` : ''}
        <p style="margin-top:18px; color:#64748b; font-size:13px;">If you need to reschedule, please message your mentor or reach out via the chat.</p>
        <p style="color:#94a3b8; font-size:12px; margin-top:18px;">Regards,<br/>SkillSwap Team</p>
      </div>
    </div>
  `;
};

exports.sessionScheduledMentor = ({ learnerName, mentorName, skill, dateStr, timeStr, meetingLink }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; max-width:680px; background:#f9fafb;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:24px; border-radius:8px; box-shadow:0 4px 16px rgba(15,23,42,0.06); color:#0f172a;">
        <h2 style="color:#0f172a; margin-bottom:8px;">Session Scheduled with Learner</h2>
        <p style="color:#475569;">Hello ${mentorName},</p>
        <p style="color:#475569;">You have scheduled a session with <strong>${learnerName}</strong>.</p>
        <table style="width:100%; margin-top:12px; border-collapse:collapse; font-size:14px; color:#0f172a;">
          <tr><td style="padding:6px 0; width:120px;"><strong>Topic</strong></td><td style="padding:6px 0;">${skill}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Date</strong></td><td style="padding:6px 0;">${dateStr}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Time</strong></td><td style="padding:6px 0;">${timeStr}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Meeting Link</strong></td><td style="padding:6px 0;"><a href="${meetingLink}" style="color:#2563eb">${meetingLink}</a></td></tr>
        </table>
        <p style="margin-top:18px; color:#64748b; font-size:13px;">Thanks for organizing — learners will see this in their inbox and the chat.</p>
        <p style="color:#94a3b8; font-size:12px; margin-top:18px;">Regards,<br/>SkillSwap Team</p>
      </div>
    </div>
  `;
};

exports.requestRejectedEmail = ({ learnerName, mentorName, skill }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px;">
      <h3 style="color:#EF4444;">Session Request Update</h3>
      <p>Hello ${learnerName},</p>
      <p>Your request with <strong>${mentorName}</strong> for <strong>${skill}</strong> was declined.</p>
      <p>You can request another mentor anytime via the SkillSwap marketplace.</p>
      <p style="color:#6B7280; font-size:13px; margin-top:18px;">Regards,<br/>SkillSwap Team</p>
    </div>
  `;
};

exports.newRequestNotification = ({ mentorName, learnerName, skill, message }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px;">
      <h3 style="color:#4F46E5;">New Session Request</h3>
      <p>Hello ${mentorName},</p>
      <p><strong>${learnerName}</strong> has requested a session for <strong>${skill}</strong>.</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <p>Please visit your dashboard to accept and schedule the session.</p>
      <p style="color:#6B7280; font-size:13px; margin-top:18px;">Regards,<br/>SkillSwap Team</p>
    </div>
  `;
};

