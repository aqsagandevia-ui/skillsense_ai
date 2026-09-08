const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdmin() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI not set in environment');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const email = 'admin.auto@example.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', email);
      console.log(existing);
      process.exit(0);
    }

    const password = 'AdminPass123!';
    const hashed = await bcrypt.hash(password, 10);

    const doc = { name: 'Auto Admin', email, password: hashed, role: 'admin', isBlocked: false, createdAt: new Date(), updatedAt: new Date() };
    await User.collection.insertOne(doc);
    console.log('Inserted admin (raw):', email, 'password:', password);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }
}

createAdmin();
