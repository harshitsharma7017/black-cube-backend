import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import healthRoutes from './routes/health';
import recordRoutes from './routes/record.routes';
import summaryRoutes from './routes/summary.routes';
import historyRoutes from './routes/history.routes';
import authRoutes from './routes/auth.routes';
import importRoutes from './routes/import.routes';

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api', historyRoutes);
app.use('/api/import', importRoutes);
app.use('/api/auth', authRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;