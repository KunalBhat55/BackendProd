import { app } from "./app.js";
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import { uploadToCloudinary } from "./utils/cloudinary.js";

dotenv.config({path: "./env",})

// uploadToCloudinary("./public/newFolder/TheBeach.jpg")

connectDB().then(() => {
 
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
})
.catch((error) => {
  console.log(`MongoDB connection error: ${error}`);
})
