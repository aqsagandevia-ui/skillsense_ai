const io = require('socket.io-client');
const axios = require('axios');

const API = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await axios.post(`${API}/auth/login`, { email, password });
  return res.data;
}

async function run() {
  try {
    const mentor = await login('mentor.test@example.com', 'Pass1234!');
    const learner = await login('learner.test@example.com', 'Pass1234!');

    console.log('Mentor ID:', mentor.user._id);
    console.log('Learner ID:', learner.user._id);

    const mentorSocket = io('http://localhost:5000', { auth: { token: mentor.token }, transports: ['websocket'] });
    const learnerSocket = io('http://localhost:5000', { auth: { token: learner.token }, transports: ['websocket'] });

    mentorSocket.on('connect', () => {
      console.log('Mentor socket connected', mentorSocket.id);
      mentorSocket.emit('join_chat', { senderId: mentor.user._id, receiverId: learner.user._id });
    });

    learnerSocket.on('connect', () => {
      console.log('Learner socket connected', learnerSocket.id);
      learnerSocket.emit('join_chat', { senderId: learner.user._id, receiverId: mentor.user._id });

      // send a test message after joining
      const clientMessageId = `test-${Date.now()}`;
      console.log('Learner sending test message...');
      learnerSocket.emit('send_message', {
        receiverId: mentor.user._id,
        message: 'Hello mentor — this is an automated socket test',
        clientMessageId
      });
    });

    mentorSocket.on('receive_message', (msg) => {
      console.log('Mentor received message via socket:', msg.text, 'from', msg.sender._id);
    });

    learnerSocket.on('receive_message', (msg) => {
      console.log('Learner received message via socket (echo):', msg.text);
    });

    // also listen for message_received notifications
    mentorSocket.on('message_received', (data) => {
      console.log('Mentor message_received notification:', data.from);
    });

    // wait a few seconds then exit
    setTimeout(() => {
      mentorSocket.close();
      learnerSocket.close();
      console.log('Test completed, sockets closed.');
      process.exit(0);
    }, 5000);

  } catch (err) {
    console.error('Test error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

run();
