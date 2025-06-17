// backend/server-minimal.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Basic CORS setup for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://rockview.vercel.app',
    'https://rockview-frontend.vercel.app',
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

connectDB();

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'RockView Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Basic districts endpoint (public)
app.get('/api/public/districts', (req, res) => {
  res.json([
    { _id: '1', name: 'Test District 1', districtNumber: 1, pastorName: 'Unassigned' },
    { _id: '2', name: 'Test District 2', districtNumber: 2, pastorName: 'Unassigned' }
  ]);
});

// Basic auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.json({
    message: 'Login endpoint working',
    token: 'test-token-123',
    user: {
      _id: 'test-user-id',
      name: 'Test User',
      email: req.body.email || 'test@example.com',
      role: 'admin'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Missing'}`);
});

module.exports = app;