import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utilsasyncHandler/.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res
      .status(400)
      .json({ message: "VideoId not found", success: false });
  }

  const comments = await Comment.find({ video: videoId }).populate(
    "owner",
    "username"
  );

  res.status(200).json({ comments, success: true });
});

const createComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;

  if (!content || !videoId) {
    return res
      .status(400)
      .json({ message: "Content or VideoId not found", success: false });
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    return res
      .status(400)
      .json({ message: "Invalid comment data", success: false });
  }

  return res.status(201).json({ comment, success: true });
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res
      .status(404)
      .json({ message: "No Comment Found", success: false });
  }

  if (req.user._id.toString() !== comment.owner.toString()) {
    return res
      .status(409)
      .json({ message: "You are not authorized to update", success: false });
  }

  await comment.updateOne({ content }, { new: true });

  return res.status(200).json({ comment, success: true });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res
      .status(404)
      .json({ message: "No Comment Found", success: false });
  }

  if (req.user._id.toString() !== comment.owner.toString()) {
    return res
      .status(409)
      .json({ message: "You are not authorized to delete", success: false });
  }

  await comment.deleteOne();

  return res.status(200).json({ message: "Comment Deleted", success: true });
});

export { getVideoComments, createComment, updateComment, deleteComment };
