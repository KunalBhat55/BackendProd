import { Router } from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  createComment,
  getVideoComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyUser); // Protect all routes below

router.route("/video/:videoId").get(getVideoComments).post(createComment);

router.route("/comment/:commentId").patch(updateComment).delete(deleteComment);

export default router;
