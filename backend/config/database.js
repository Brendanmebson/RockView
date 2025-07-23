const mongoose = require('mongoose');

const connectDB = async () => {
  try {
// Remove deprecated options - they're not needed in newer versions
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database Name: ${conn.connection.name}`);

// Log connection state
    console.log(`🔗 Connection State: ${getConnectionState(conn.connection.readyState)}`);

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('🔍 Check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

// Helper function to get readable connection state
const getConnectionState = (state) => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
    99: 'Uninitialized'
  };
  return states[state] || 'Unknown';
};

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🎉 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔄 Mongoose connection closed due to app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing mongoose connection:', error);
    process.exit(1);
  }
});

module.exports = connectDB;