// backend/scripts/cleanupDatabase.js
require('dotenv').config();
const mongoose = require('mongoose');

const cleanupDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Drop the username index if it exists
    try {
      await mongoose.connection.db.collection('users').dropIndex('username_1');
      console.log('Dropped username index successfully');
    } catch (error) {
      console.log('Username index does not exist or already dropped');
    }
    
    // Remove username field from all users
    const result = await mongoose.connection.db.collection('users').updateMany(
      {},
      { $unset: { username: "" } }
    );
    
    console.log(`Updated ${result.modifiedCount} user documents to remove username field`);
    
    await mongoose.connection.close();
    console.log('Database cleanup completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Error during database cleanup:', error);
    process.exit(1);
  }
};

cleanupDatabase();