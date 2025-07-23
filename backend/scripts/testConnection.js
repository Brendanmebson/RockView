// scripts/testConnection.js
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log(`📝 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

// Try to connect
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connection successful!');
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    console.log(`🔗 State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);

// Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Collections found: ${collections.length}`);

    if (collections.length > 0) {
      console.log(`📋 Collection names: ${collections.map(c => c.name).join(', ')}`);
    }

    await mongoose.connection.close();
    console.log('🔄 Connection closed successfully');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);

    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication failed. Check:');
      console.log('   - Username and password in MongoDB URI');
      console.log('   - Database user permissions');
      console.log('   - IP whitelist in MongoDB Atlas');
    }

    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS resolution failed. Check:');
      console.log('   - MongoDB cluster hostname');
      console.log('   - Internet connection');
    }

    if (error.message.includes('timeout')) {
      console.log('\n💡 Connection timeout. Check:');
      console.log('   - Network connectivity');
      console.log('   - MongoDB Atlas IP whitelist');
      console.log('   - Firewall settings');
    }
  }

  process.exit(0);
};

testConnection();
