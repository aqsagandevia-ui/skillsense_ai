/* global process */
import axios from 'axios';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000/api';

async function registerIfNeeded(email, name, password, role){
  try{
    await axios.post(`${API}/auth/register`, { fullName: name, email, password, role });
    console.log(`[register] created ${email}`);
  }catch(e){
    if (e.response && e.response.data && e.response.data.msg && e.response.data.msg.includes('User already exists')){
      console.log(`[register] already exists ${email}`);
    } else {
      console.error('[register] error', e.response?.data || e.message);
    }
  }
}

async function login(email, password){
  const res = await axios.post(`${API}/auth/login`, { email, password });
  return res.data;
}

async function run(){
  const pass = 'Pass1234';
  const emailA = `mentor.${Date.now()}@example.com`;
  const emailB = `learner.${Date.now()}@example.com`;

  await registerIfNeeded(emailA, 'Test Mentor', pass, 'mentor');
  await registerIfNeeded(emailB, 'Test Learner', pass, 'learner');

  const a = await login(emailA, pass);
  const b = await login(emailB, pass);

  console.log('Logged in users:', a.user._id, b.user._id);

  const socketA = io('http://localhost:5000', { transports: ['websocket'] });
  const socketB = io('http://localhost:5000', { transports: ['websocket'] });

  socketA.on('connect', () => {
    console.log('socketA connected', socketA.id);
    socketA.emit('user_online', a.user._id);
  });

  socketB.on('connect', () => {
    console.log('socketB connected', socketB.id);
    socketB.emit('user_online', b.user._id);
  });

  socketA.on('receive_message', (msg) => {
    console.log('[socketA] receive_message', msg.sender?._id || msg.sender);
  });
  socketB.on('receive_message', (msg) => {
    console.log('[socketB] receive_message', msg.sender?._id || msg.sender, 'text:', msg.text);
  });

  // wait for both connections
  await new Promise(r => setTimeout(r, 1500));

  // join chat rooms
  socketA.emit('join_chat', { receiverId: b.user._id });
  socketB.emit('join_chat', { receiverId: a.user._id });

  // send message A -> B
  await new Promise(r => setTimeout(r, 500));
  console.log('A -> B: Hello from Mentor');
  const clientMessageId = `${a.user._id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  socketA.emit('send_message', { receiverId: b.user._id, message: 'Hello from Mentor', chatId: [a.user._id, b.user._id].sort().join('_'), clientMessageId });

  // Send duplicate immediately to test dedupe (same clientMessageId)
  await new Promise(r => setTimeout(r, 200));
  console.log('A -> B (duplicate): Hello from Mentor (same clientMessageId)');
  socketA.emit('send_message', { receiverId: b.user._id, message: 'Hello from Mentor', chatId: [a.user._id, b.user._id].sort().join('_'), clientMessageId });

  // wait
  await new Promise(r => setTimeout(r, 1000));

  // send message B -> A
  console.log('B -> A: Hi Mentor, this is Learner');
  socketB.emit('send_message', { receiverId: a.user._id, message: 'Hi Mentor, this is Learner', chatId: [a.user._id, b.user._id].sort().join('_') });

  await new Promise(r => setTimeout(r, 1500));

  socketA.disconnect();
  socketB.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err.response?.data || err.message); process.exit(1); });
