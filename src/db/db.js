import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
  path: "./env",
});

const connectDB = async () => {
  try {
    const db = await mongoose.connect(`${process.env.MONGODB_URI}/youtube`);

    console.log("Database is connected to:", db.connection.name);
  } catch (error) {
    console.log(`MongoDB connection error: ${error}`);
  }
};

export default connectDB;
