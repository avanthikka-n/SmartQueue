import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Security middleware
import {
  helmetMiddleware,
  globalLimiter,
  authLimiter,
  tokenLimiter,
  mongoSanitizeMiddleware,
  xssSanitize
} from './middleware/security.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import counterRoutes from './routes/counterRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

dotenv.config();

const app = express();

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmetMiddleware);

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // Prevent huge JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Sanitization ─────────────────────────────────────────────────────────────
app.use(mongoSanitizeMiddleware);   // NoSQL injection prevention
app.use(xssSanitize);              // XSS HTML entity escaping

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
// Auth routes get stricter brute-force protection
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/organizations', orgRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/staff', staffRoutes);

// Token generation routes get flood protection
app.use('/api/tokens', tokenLimiter, tokenRoutes);
app.use('/api/queue', tokenRoutes);

app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'SmartQueue — Universal Token & Facility Flow Management Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    security: {
      helmet: true,
      rateLimiting: true,
      mongoSanitize: true,
      xssSanitize: true
    }
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint Not Found: ${req.method} ${req.originalUrl}`
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
