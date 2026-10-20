import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    console.warn(`[Database Warning] Please make sure MongoDB service is running on ${process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue'}`);
    return null;
  }
};
