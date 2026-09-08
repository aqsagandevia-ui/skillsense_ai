const mongoose = require('mongoose');
const User = require('../models/User');
require("dotenv").config();

async function migrateRoles() {
  try {
    // Connect to DB (same as server.js)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB for migration");

    console.log('🔍 Finding users with legacy role "user"...');
    const legacyUsers = await User.find({ role: 'user' });
    console.log(`📊 Found ${legacyUsers.length} users with role: "user"`);

    if (legacyUsers.length === 0) {
      console.log('✅ No legacy users found. Migration complete.');
      process.exit(0);
    }

    // Update to "learner"
    const updateResult = await User.updateMany(
      { role: 'user' },
      { $set: { role: 'learner' } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} users to role: "learner"`);
    console.log('📋 Emails affected:');
    legacyUsers.forEach(user => console.log(`  - ${user.email}`));

    // Verify
    const remaining = await User.find({ role: 'user' });
    console.log(`🔍 Remaining "user" roles: ${remaining.length}`);

    mongoose.connection.close();
    console.log('🎉 Migration successful!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateRoles();
