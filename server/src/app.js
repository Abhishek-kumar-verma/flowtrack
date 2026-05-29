process.env.TZ = 'Asia/Kolkata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js';

// ── Route imports ──────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import gymRoutes from './routes/gym.js';
import learningRoutes from './routes/learning.js';
import habitRoutes from './routes/habits.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import quoteRoutes from './routes/quotes.js';
import moodRoutes from './routes/mood.js';
import pomodoroRoutes from './routes/pomodoro.js';

// ── Middleware imports ─────────────────────────────────────────────────────────
import errorHandler from './middleware/errorHandler.js';

// ── Cron jobs ──────────────────────────────────────────────────────────────────
import { startCronJobs } from './jobs/cronJobs.js';

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
];
console.log('Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS policy: origin ${origin} is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Todo Tracker API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/learning',learningRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai',aiRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/pomodoro',pomodoroRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered LAST — after all routes
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT, 10) || 5000;

sequelize.authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
      startCronJobs();
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

export default app;
