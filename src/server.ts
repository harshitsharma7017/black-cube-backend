import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    // Start listening first so Cloud Run can detect the container.
    app.listen(PORT, async () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`,
      );

      try {
        await connectDB();
        console.log('MongoDB connected successfully');
      } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();