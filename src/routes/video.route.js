import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { uploadVideo, getVideoById, deleteVideo } from "../controllers/video.controller.js";

const router = Router();

router
  .route("/upload-video")
  .post(
    verifyUser,
    upload.fields([{ name: "userVideo" }, { name: "thumbnail" }]),
    uploadVideo
  );

router.route("/:videoId").get(verifyUser, getVideoById).delete(verifyUser, deleteVideo);


export default router;
