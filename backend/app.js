import express from 'express';
import cors from 'cors';

// Model imports (to ensure they're loaded)
import './models/User.js';
import './models/Recruiter.js';
import './models/Job.js';
import './models/JobApplication.js';
import './models/Post.js';
import './models/Connection.js';
import './models/Message.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userAuthRoutes from './routes/userAuthRoutes.js';
import recruiterAuthRoutes from './routes/recruiterAuthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import postRoutes from './routes/postRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

export const createApp = ({ io } = {}) => {
  const app = express();

  if (io) {
    app.set('io', io);
  }

  app.use(cors());

  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/uploads', express.static('uploads'));

  app.use('/api/auth', authRoutes);
  app.use('/api/auth/user', userAuthRoutes);
  app.use('/api/auth/recruiter', recruiterAuthRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/recruiters', recruiterRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/connections', connectionRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/jobs', jobRoutes);

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running successfully',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to Global Connect API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        health: '/api/health'
      }
    });
  });

  app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((error) => error.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  });

  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  });

  return app;
};

const app = createApp();

export default app;