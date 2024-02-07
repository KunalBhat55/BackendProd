import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath) => {
  try {
    if (!filePath) return "file not found";
      
      // we can use image's name with condition 
      // delete the file if user upload the same file to cloudinary
      
      

    const response = await cloudinary.uploader.upload(filePath, {resource_type: "auto"});
    console.log("uploaded to cloudinary!", response);
    fs.unlinkSync(filePath); 

    return response;

  } catch (error) {
    fs.unlinkSync(filePath); // delete file from server
    console.log(error);
    return null;
  }
};
export { uploadToCloudinary };
