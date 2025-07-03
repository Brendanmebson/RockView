const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// @desc    Health check endpoint
// @route   GET /api/ping
// @access  Public
const ping = async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Basic health info
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Simple ping for uptime monitoring
router.get('/', ping);

module.exports = router;