import { verifyUser } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.use(verifyUser);

router.route("/toggle/video/:videoId").post(toggleVideoLike);
router.route("/toggle/tweet/:tweetId").post(toggleTweetLike);
router.route("/toggle/comment/:commentId").post(toggleCommentLike);
router.route("/videos").get(getVideoLikes);

export default router;
