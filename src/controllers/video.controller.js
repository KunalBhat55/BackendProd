import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const uploadVideo = asyncHandler(async (req, res) => {
  // try update here or separate
  const { title, description, views, isPublished } = req.body;

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
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description: description || "",
    duration: videoFile.duration || "",
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
  
  const {page, limit} = req.query;


});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoData = await Video.findById(videoId);

  if (!videoData) {
    throw new ApiError(404, "Video not found!");
  }

  return res.status(200).json({ data: videoData });
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoData = await Video.findByIdAndDelete(videoId);
  // video owner check
  if(videoData.owner._id !== req.user._id){
  
  }

  // delete from cloudinary

  if (!videoData) {
    throw new ApiError(404, "Video not found!");
  }

  return res.status(200).json({ message: "Video Deleted!" });
});

export { uploadVideo, getVideos, getVideoById };
