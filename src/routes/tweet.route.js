import { Router } from "express";
import {
  createTweet,
  editTweet,
  deleteTweet,
  getUserTweets,
} from "../controllers/tweet.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyUser);


router.route("/createTweet").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(editTweet).delete(deleteTweet);

export default router;
