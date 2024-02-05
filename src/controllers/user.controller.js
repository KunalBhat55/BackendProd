import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { options } from "../utils/options.js";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Token generation failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  console.log(req.files);

  // if exist?
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // const [{path: avatarLocal}]  = req.files?.avatar
  // const [{path: coverImageLocal}]  = req.files.coverImage ? req.files.coverImage : ""

  // upload to cloudinary
  const avatarLocal = req.files?.avatar[0]?.path; // chaining
  const coverImageLocal = req.files?.coverImage[0]?.path;

  if (!avatarLocal) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadToCloudinary(avatarLocal);
  const coverImage = await uploadToCloudinary(coverImageLocal);
  // let coverImage = "";

  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  // create user
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullName,
    avatar,
    coverImage: coverImage || "",
  });

  if (!user) {
    throw new ApiError(500, "User creation failed");
  }

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordMatch = await user.isPasswordCorrect(password); // this is a method in user model
  if (!isPasswordMatch) {
    throw new ApiError(401, "Incorrect password");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  ); // generate tokens and save refresh token to db

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // key, value, options
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken, // remove this in production
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req.user);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: "" },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options) // key, value, options
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const clientRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  console.log(req.cookies);
  if (!clientRefreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
    // throw new ApiError(401, "Unauthorized");
  }

  const decoded = jwt.verify(
    clientRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (!decoded) {
    throw new ApiError(401, "Invalid token");
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "No user found with this token");
  }

  if (user.refreshToken !== clientRefreshToken) {
    // db has encoded 'token' as req
    throw new ApiError(401, "Refresh token is expired");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "AccessToken generated successfully!", {
        accessToken,
        refreshToken,
      })
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if ([currentPassword, newPassword].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user._id); // req.user is from auth middleware

  const isPasswordMatch = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordMatch) {
    throw new ApiError(401, "Incorrect password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ message: "Password changed successfully" }, {});
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  ); // verify if user is in db

  return res.status(200).json(user);
});

const updateUserDetails = asyncHandler(async (req, res) => {
  // TODO: delete old avatar and coverImage from cloudinary

  const { fullName, username, email } = req.body;
  console.log("Controller", req.files);

  let avatarLocalPath = undefined;
  let coverImageLocalPath = undefined;

  if (req.files.avatar) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  if (req.files.coverImage) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (fullName) user.fullName = fullName;
  if (username) user.username = username;
  if (email) user.email = email;

  if (avatarLocalPath) {
    const avatar = await uploadToCloudinary(avatarLocalPath);
    user.avatar = avatar;
  }
  if (coverImageLocalPath) {
    const coverImage = await uploadToCloudinary(coverImageLocalPath);
    user.coverImage = coverImage;
  }

  await user.save({ validateBeforeSave: false });

  // if(!fullName || !username || !email){

  //   throw new ApiError(400, "All fields are required")

  // }

  // const user = await User.findByIdAndUpdate(
  //   req.user._id,
  //   {
  //     $set: {
  //       fullName, // fullName: fullName
  //       username,
  //       email,
  //     },
  //   },
  //   { new: true }
  // );

  return res
    .status(200)
    .json({ message: "Account details Updated", data: user });
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadToCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar } },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json({ message: "Avatar updated", data: user });
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is required");
  }
  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(400, "coverImage file is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage } },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json({ message: "Cover Image updated", data: user });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  // const user = await User.findOne({ username }).select("-password -refreshToken");
  // if (!user) {
  //   throw new ApiError(404, "User not found");
  // }

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        subscribedToCount: { $size: "$subscribedTo" },

        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        refreshToken: false,
        password: false,

        subscribedToCount: true,
        subscriberCount: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        coverImage: true,
      },
    },
  ]);

  if (!channel.length) {
    throw new ApiError(404, "Channel not found");
  }

  console.log(channel);

  return res
    .status(200)
    .json({ message: "User channel fetched", data: channel[0] });
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  getUserProfile,
};
