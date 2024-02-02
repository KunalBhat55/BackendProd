import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { decode } from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrors.js";

export const verifyUser = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // replace Bearer with empty string

      console.log(req.cookies)

    if (!token) {
      // throw new ApiError(401, "Unauthorized");
      return res.status(401).json({
        success: false,
        message: "Unauthorized Token not found",
      });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
      if (err) {
        throw new ApiError(401, "token expired");
      }

      const user = await User.findById(decodedUser?._id).select( 
        "-password -refreshToken"
      );

      req.user = user; // adding user from db to req object
      next();
    });
  } catch (error) {
    throw new ApiError(401, error.message || "Unauthorized");
  }
});
