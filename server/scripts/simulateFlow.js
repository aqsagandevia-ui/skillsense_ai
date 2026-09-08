const axios = require('axios');

const api = 'http://localhost:5000/api';

async function safeRegister(user) {
  try {
    const res = await axios.post(`${api}/auth/register`, user);
    console.log(`Registered ${user.email}:`, res.data.message || res.data);
  } catch (err) {
    console.log(`Register skipped ${user.email}:`, err.response ? err.response.data : err.message);
  }
}

async function login(email, password) {
  try {
    const res = await axios.post(`${api}/auth/login`, { email, password });
    console.log(`Login ${email} OK`);
    return res.data;
  } catch (err) {
    console.error(`Login failed ${email}:`, err.response ? err.response.data : err.message);
    return null;
  }
}

async function run() {
  try {
    await safeRegister({ fullName: 'Mentor User', email: 'mentor.test@example.com', password: 'Pass1234!', role: 'mentor' });
    await safeRegister({ fullName: 'Learner User', email: 'learner.test@example.com', password: 'Pass1234!', role: 'learner' });

    const mentor = await login('mentor.test@example.com', 'Pass1234!');
    const learner = await login('learner.test@example.com', 'Pass1234!');
    if (!mentor || !learner) {
      console.error('Missing mentor or learner tokens, aborting');
      return;
    }

    // Ensure mentor has a skill to match
    try {
      const addSkillRes = await axios.post(`${api}/skills`, { skillName: 'Web Development', category: 'technology' }, { headers: { Authorization: `Bearer ${mentor.token}` } });
      console.log('Skill created by mentor:', addSkillRes.data.skill._id);
    } catch (err) {
      console.log('Add skill skipped or failed:', err.response ? err.response.data : err.message);
    }

    // Create session as learner
    const createRes = await axios.post(`${api}/session`, { teacherId: mentor.user._id, skill: 'Web Development', message: 'Automation test session' }, { headers: { Authorization: `Bearer ${learner.token}` } });
    console.log('Session created:', createRes.data.session._id);
    const sessionId = createRes.data.session._id;

    // Mentor accepts and schedules
    const date = new Date(); date.setDate(date.getDate() + 1);
    const dateStr = date.toISOString().slice(0,10);
    const time = '15:00';
    const acceptRes = await axios.put(`${api}/session/accept`, { sessionId, date: dateStr, time }, { headers: { Authorization: `Bearer ${mentor.token}` } });
    console.log('Accept result:', acceptRes.data.msg || acceptRes.data);

    // Login admin and fetch dashboard
    const adminLogin = await login('admin.auto@example.com', 'AdminPass123!');
    if (!adminLogin) { console.log('Admin login failed'); return; }
    const dash = await axios.get(`${api}/admin/dashboard`, { headers: { Authorization: `Bearer ${adminLogin.token}` } });
    console.log('Admin dashboard:', dash.data);

  } catch (err) {
    console.error('Flow error:', err.response ? err.response.data : err.message);
  }
}

run();
