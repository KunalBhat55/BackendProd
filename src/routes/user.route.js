import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  getUserProfile,
  watchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

// upload.fields() is used to upload multiple files
// handle same routes with different methods

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyUser, logoutUser);
router.route("/refresh-token").post(verifyUser, refreshAccessToken);
router.route("/change-password").post(verifyUser, changeCurrentPassword);
router.route("/getCurrentUser").get(verifyUser, getCurrentUser);

router.route("/update-user").patch(
  verifyUser,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateUserDetails
);

router.route("/c/:username/").get(verifyUser, getUserProfile);
router.route("/watch-history").get(verifyUser, watchHistory);

export default router;
