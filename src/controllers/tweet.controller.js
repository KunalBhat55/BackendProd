import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res
      .status(404)
      .json({ message: "Content is required", success: false });
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    return res
      .status(500)
      .json({ message: "Tweet creation failed", success: false });
  }

  res.status(200).json({ tweet, success: true });
});

const editTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId || !content) {
    return res
      .status(404)
      .json({ message: "tweetId or content is required", success: false });
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    return res.status(404).json({ message: "tweet not found", success: false });
  }


  if (tweet.owner.toString() !== req.user._id.toString()) {
    return res.status(409).json({
      message: "You are not authorized to edit this tweet",
      success: false,
    });
  }

  await tweet.updateOne({ content }, { new: true });

  return res.status(200).json({ tweet, success: true });
});
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    return res
      .status(404)
      .json({ message: "tweetId is required", success: false });
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    return res.status(404).json({ message: "Tweet not found", success: false });
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    return res.status(409).json({
      message: "You are not authorized to delete this tweet",
      success: false,
    });
  }

  await tweet.deleteOne(); // will only delete one tweet with the given id

  return res.status(200).json({ message: "Tweet deleted", success: true });

});
const getUserTweets = asyncHandler(async (req, res) => {
 
    const { userId } = req.params;
    const tweets = await Tweet.find({ owner: userId }).populate("owner", "username");
    if (!tweets) {
        return res.status(404).json({ message: "No tweets found", success: false });
    }
    res.status(200).json({ tweets, success: true });


});

export { createTweet, editTweet, deleteTweet, getUserTweets };
