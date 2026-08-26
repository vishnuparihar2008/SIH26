import config from "../config/config.js";
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!config.mongoUri) {
      console.warn("[db] Warning: MONGO_URI is not configured. Running without active MongoDB connection.");
      return;
    }
    await mongoose.connect(config.mongoUri);
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
  }
};

export default connectDB;

