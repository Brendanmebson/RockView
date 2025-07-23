const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
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
  /^https:\/\/.*--rockview.*\.vercel\.app$/// Vercel preview deployments
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
  maxAge: 86400,// 24 hours
  optionsSuccessStatus: 200// For legacy browser support
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

// Health check endpoints (for uptime monitoring)
const healthCheck = async (req, res) => {
  try {
// Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

// Basic health info
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

// If database is disconnected, return 503
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        ...healthData,
        status: 'UNHEALTHY',
        error: 'Database disconnected'
      });
    }

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
};

// Multiple health check endpoints for different monitoring services
app.get('/health', healthCheck);
app.get('/ping', healthCheck);
app.get('/api/ping', healthCheck);
app.get('/api/health', healthCheck);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'RockView Backend API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health, /ping, /api/ping, /api/health',
      api: '/api/*',
      docs: 'Available routes listed below'
    }
  });
});

// API Routes - Load routes individually with error handling
const loadRoute = (path, routeFile, routeName) => {
  try {
    app.use(path, require(routeFile));
    console.log(`✅ ${routeName} routes loaded`);
    return true;
  } catch (error) {
    console.error(`❌ Error loading ${routeName} routes:`, error.message);
    return false;
  }
};

// Load routes with individual error handling
console.log('🔄 Loading API routes...');

// Public routes (no authentication required)
loadRoute('/api/public', './routes/publicRoutes', 'Public');

// Authentication routes
loadRoute('/api/auth', './routes/authRoutes', 'Authentication');

// Protected routes (authentication required)
loadRoute('/api/users', './routes/userRoutes', 'Users');
loadRoute('/api/districts', './routes/districtRoutes', 'Districts');
loadRoute('/api/zonal-supervisors', './routes/zonalSupervisorRoutes', 'Zonal Supervisors');
loadRoute('/api/area-supervisors', './routes/areaSupervisorRoutes', 'Area Supervisors');
loadRoute('/api/cith-centres', './routes/cithCentreRoutes', 'CITH Centres');
loadRoute('/api/messages', './routes/messageRoutes', 'Messages');
loadRoute('/api/notifications', './routes/notificationRoutes', 'Notifications');
loadRoute('/api/export', './routes/exportRoutes', 'Export');

// Load reports route with special handling for the async issue
try {
  const reportRoutes = require('./routes/reportRoutes');
  app.use('/api/reports', reportRoutes);
  console.log('✅ Reports routes loaded');
} catch (error) {
  console.error('❌ Error loading Reports routes:', error.message);
  console.log('🔄 Creating fallback reports routes...');

// Create fallback reports routes
  const fallbackReportsRouter = express.Router();

  fallbackReportsRouter.get('/', (req, res) => {
    res.json({ message: 'Reports endpoint temporarily unavailable. Please check server logs.' });
  });

  fallbackReportsRouter.post('/', (req, res) => {
    res.status(503).json({ message: 'Report submission temporarily unavailable. Please try again later.' });
  });

  app.use('/api/reports', fallbackReportsRouter);
  console.log('⚠️ Fallback reports routes loaded');
}

console.log('✅ Route loading completed');

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health - Health check',
      'GET /ping - Health check (alternative)',
      'GET /api/ping - Health check (API)',
      'GET /api/health - Health check (API alternative)',
      'GET / - API info',
      'GET /api/public/* - Public endpoints',
      'POST /api/auth/login - User login',
      'POST /api/auth/register - User registration',
      'GET /api/auth/profile - User profile',
      'GET /api/users - Users management',
      'GET /api/districts - Districts management',
      'GET /api/zonal-supervisors - Zonal supervisors',
      'GET /api/area-supervisors - Area supervisors',
      'GET /api/cith-centres - CITH centres',
      'GET /api/reports - Weekly reports',
      'GET /api/messages - Messaging system',
      'GET /api/export/* - Data export'
    ]
  });
});

// Global error handler
app.use(errorHandler);

// Database connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Graceful error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('🔄 Shutting down...');
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', err);
  console.error('🔄 Shutting down...');
  process.exit(1);
});

// Server startup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RockView Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📍 Server URL: ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Not configured'}`);

// Health check endpoints for monitoring
  console.log('\n🏥 Health Check Endpoints (for UptimeRobot):');
  console.log(`  GET  ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}/ping`);
  console.log(`  GET  ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}/health`);
  console.log(`  GET  ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}/api/ping`);
  console.log(`  GET  ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}/api/health`);

// Log available routes
  console.log('\n📋 Available API Routes:');
  console.log('  GET  /health                    - Health check');
  console.log('  GET  /ping                      - Health check (alternative)');
  console.log('  GET  /api/ping                  - Health check (API)');
  console.log('  GET  /api/health                - Health check (API alternative)');
  console.log('  GET  /                          - API info');
  console.log('  GET  /api/public/*             - Public endpoints');
  console.log('  POST /api/auth/register        - User registration');
  console.log('  POST /api/auth/login           - User login');
  console.log('  GET  /api/auth/profile         - User profile');
  console.log('  GET  /api/users                - Users management');
  console.log('  GET  /api/districts            - Districts management');
  console.log('  GET  /api/zonal-supervisors    - Zonal supervisors');
  console.log('  GET  /api/area-supervisors     - Area supervisors');
  console.log('  GET  /api/cith-centres         - CITH centres');
  console.log('  GET  /api/reports              - Weekly reports');
  console.log('  GET  /api/messages             - Messaging system');
  console.log('  GET  /api/export/*             - Data export');

// Log allowed origins for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🌐 Allowed CORS origins:', allowedOrigins);
  }

// UptimeRobot setup instructions
  console.log('\n🤖 UptimeRobot Setup Instructions:');
  console.log('1. Go to https://uptimerobot.com');
  console.log('2. Create a new monitor');
  console.log('3. Set Monitor Type: HTTP(s)');
  console.log('4. Set Friendly Name: RockView Health Check');
  console.log(`5. Set URL: ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}/ping`);
  console.log('6. Set Monitoring Interval: 5 minutes');
  console.log('7. Enable notifications for downtime alerts');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('🔄 HTTP server closed');

    try {
      await mongoose.connection.close();
      console.log('🗄️  Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }

    console.log('✅ Process terminated gracefully');
    process.exit(0);
  });

// Force close server after 10 seconds
  setTimeout(() => {
    console.error('⏰ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep alive function to prevent server from sleeping (for free hosting)
const keepAlive = () => {
  setInterval(() => {
    if (process.env.NODE_ENV === 'production') {
// Make a request to keep the server alive
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/ping',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        console.log(`Keep-alive ping: ${res.statusCode}`);
      });

      req.on('error', (e) => {
        console.error(`Keep-alive error: ${e.message}`);
      });

      req.end();
    }
  }, 14 * 60 * 1000);// Ping every 14 minutes
};

// Start keep-alive only in production
if (process.env.NODE_ENV === 'production') {
  console.log('🔄 Starting keep-alive service...');
  keepAlive();
}

module.exports = app;
