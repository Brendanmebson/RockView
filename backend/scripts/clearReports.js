// backend/scripts/clearReports.js
require('dotenv').config();
const mongoose = require('mongoose');
const WeeklyReport = require('../models/WeeklyReport');

const clearReports = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Delete all reports
    const result = await WeeklyReport.deleteMany({});
    console.log(`Cleared ${result.deletedCount} reports from database`);
    
    console.log('✅ All reports have been cleared!');
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error clearing reports:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Execute the function
clearReports();