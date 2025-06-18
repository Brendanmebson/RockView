const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://rockview.vercel.app',
  'https://rockview-frontend.vercel.app',
  /^https:\/\/rockview.*\.vercel\.app$/,
  /^https:\/\/.*--rockview.*\.vercel\.app$/ // Vercel preview deployments
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else {
        return allowed.test(origin);
      }
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.log(`CORS blocked origin: ${origin}`);
    const msg = `CORS policy violation: Origin ${origin} not allowed`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'Authorization'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Explicit preflight request handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.sendStatus(200);
});

// Body parser middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: '10mb' 
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'RockView Backend API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes - Wrapped in try-catch for better error handling
try {
  // Public routes (no authentication required)
  app.use('/api/public', require('./routes/publicRoutes'));
  
  // Authentication routes
  app.use('/api/auth', require('./routes/authRoutes'));
  
  // Protected routes (authentication required)
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/districts', require('./routes/districtRoutes'));
  app.use('/api/zonal-supervisors', require('./routes/zonalSupervisorRoutes'));
  app.use('/api/area-supervisors', require('./routes/areaSupervisorRoutes'));
  app.use('/api/cith-centres', require('./routes/cithCentreRoutes'));
  app.use('/api/reports', require('./routes/reportRoutes'));
  app.use('/api/messages', require('./routes/messageRoutes'));
  app.use('/api/export', require('./routes/exportRoutes'));
  
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  console.error('This might be due to missing dependencies or syntax errors in route files');
  
  // Load essential routes only
  try {
    app.use('/api/public', require('./routes/publicRoutes'));
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    console.log('✅ Essential routes loaded');
  } catch (essentialError) {
    console.error('❌ Failed to load even essential routes:', essentialError);
  }
}

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /',
      'GET /api/public/*',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile',
      'GET /api/users',
      'GET /api/districts',
      'GET /api/area-supervisors',
      'GET /api/cith-centres',
      'GET /api/reports',
      'GET /api/messages',
      'GET /api/export/*'
    ]
  });
});

// Global error handler
app.use(errorHandler);

// Graceful error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Shutting down...');
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  console.error('Shutting down...');
  process.exit(1);
});

// Server startup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 Server URL: ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
  
  // Log available routes
  console.log('\n📋 Available API Routes:');
  console.log('  GET  /health                    - Health check');
  console.log('  GET  /                          - API info');
  console.log('  GET  /api/public/*             - Public endpoints');
  console.log('  POST /api/auth/register        - User registration');
  console.log('  POST /api/auth/login           - User login');
  console.log('  GET  /api/auth/profile         - User profile');
  console.log('  GET  /api/users                - Users management');
  console.log('  GET  /api/districts            - Districts management');
  console.log('  GET  /api/area-supervisors     - Area supervisors');
  console.log('  GET  /api/cith-centres         - CITH centres');
  console.log('  GET  /api/reports              - Weekly reports');
  console.log('  GET  /api/messages             - Messaging system');
  console.log('  GET  /api/export/*             - Data export');
  
  // Log allowed origins for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🌐 Allowed CORS origins:', allowedOrigins);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;