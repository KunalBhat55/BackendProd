import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { uploadToCloudinary } from "../utils/cloudinary";
import { Video } from "../models/video.model.js";

const uploadVideo = asyncHandler(async (req, res) => {

  // try update here or separate 
  const { title, description, duration, views, isPublished } = req.body;

  if (!title) {
    return res.status(401).json({ message: "Title is required!" });
  }
  console.log(req.files);

  const videoLocalPath = req.files?.userVideo[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    return res.status(401).json({ message: "Video is required!" });
  }
  if (!thumbnailLocalPath) {
    return res.status(401).json({ message: "Thumbnail is required!" });
  }

  const videoFile = await uploadToCloudinary(videoLocalPath);
  const thumbnail = await uploadToCloudinary(thumbnailLocalPath);

  const videoData = await Video.create({
    videoFile,
    thumbnail,
    title,
    description: description || "",
    duration: duration || "",
    views: views || "",
    isPublished: isPublished || false,
  });

  if (!videoData) {
    res.status(500).json({ message: "Video Data Creation Failed!" });
  }

  return res
    .status(200)
    .json({ message: "Video Data Created successfully!", data: videoData });


});
const getVideos = asyncHandler(async (req, res) => {

    // 


});

export { uploadVideo };
