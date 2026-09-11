import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "../src/app";
import { connectDB } from "../src/config/db";

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    if (mongoose.connection.readyState >= 1) {
      isConnected = true;
    } else {
      await connectDB();
      isConnected = true;
    }
  }
  
  return app(req, res);
}
