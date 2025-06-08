// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path'); // Add this
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/districts', require('./routes/districtRoutes'));
app.use('/api/zonal-supervisors', require('./routes/zonalSupervisorRoutes'));
app.use('/api/area-supervisors', require('./routes/areaSupervisorRoutes'));
app.use('/api/cith-centres', require('./routes/cithCentreRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Add test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  });
});

// Serve static files from React build (ADD THIS)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle React Router - catch all requests that don't match API routes (ADD THIS)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));