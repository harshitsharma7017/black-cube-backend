import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import recordRoutes from './routes/record.routes';
import summaryRoutes from './routes/summary.routes';
import importRoutes from './routes/import.routes';

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/import', importRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
