import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
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
    owner: req.user._id,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description: description || "",
    duration: videoFile.duration || "",
    views: views || "",
    isPublished: isPublished || false,
    videoFilePublicId: videoFile.public_id,
    thumbnailPublicId: thumbnail.public_id,
  });

  if (!videoData) {
    res.status(500).json({ message: "Video Data Creation Failed!" });
  }

  return res
    .status(200)
    .json({ message: "Video Data Created successfully!", data: videoData });
});
const getVideos = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoData = await Video.findById(videoId);

  if (!videoData) {
    return res
      .status(404)
      .json({ message: "Video with Id not found!", success: false });
  }

  return res.status(200).json({ data: videoData });
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoData = await Video.findById(videoId);

  if (!videoData) {
    return res
      .status(404)
      .json({ message: "Video not found!", success: false });
  }
  // video owner check
  if (videoData.owner.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      message: "You are not authorized to delete this video!",
      success: false,
    });
  }

  // delete from cloudinary

  const videoDelete = await deleteFromCloudinary(
    videoData.videoFilePublicId,
    "video"
  );
  const thumbnailDelete = await deleteFromCloudinary(
    videoData.thumbnailPublicId,
    "image"
  );

  if (!videoDelete || !thumbnailDelete) {
    return res
      .status(500)
      .json({
        message: "Failed to delete Video or Thumbnail!",
        success: false,
      });
  }

  const deletedvideo = await Video.findByIdAndDelete(videoId);

  if (!deletedvideo) {
    throw new ApiError(500, "Video Deletion Failed!");
  }

  return res.status(200).json({ message: "Video Deleted!", success: true });
});

export { uploadVideo, getVideos, getVideoById, deleteVideo };
