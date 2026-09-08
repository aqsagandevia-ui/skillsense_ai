const axios = require('axios');

const API = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await axios.post(`${API}/auth/login`, { email, password });
  return res.data;
}

async function run() {
  try {
    // Login accounts
    const learner = await login('learner.test@example.com', 'Pass1234!');
    const mentor = await login('mentor.test@example.com', 'Pass1234!');
    const admin = await login('admin.auto@example.com', 'AdminPass123!');

    console.log('Learner id:', learner.user._id);
    console.log('Mentor id:', mentor.user._id);

    // Learner posts a review for mentor
    const token = learner.token;
    const review = { rating: 5, comment: 'Great session, very helpful (automated test)' };
    const post = await axios.post(`${API}/users/reviews/${mentor.user._id}`, review, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Review posted:', post.data.message || post.data);

    // Mentor fetches own reviews
    const mentorRes = await axios.get(`${API}/users/reviews/me`, { headers: { Authorization: `Bearer ${mentor.token}` } });
    console.log('Mentor reviews count:', mentorRes.data.reviews?.length || 0);
    console.log('Sample mentor review:', mentorRes.data.reviews?.[0] || 'none');

    // Admin fetches all reviews
    const adminRes = await axios.get(`${API}/admin/reviews`, { headers: { Authorization: `Bearer ${admin.token}` } });
    console.log('Admin reviews total:', adminRes.data.reviews?.length || 0);

    process.exit(0);
  } catch (err) {
    console.error('Test error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

run();
