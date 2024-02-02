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

  const isPasswordMatch = await user.isPasswordCorrect(password);
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

  console.log(req.cookies)
  if (!clientRefreshToken) {

    return res.status(401).json({message: "Unauthorized"})
    // throw new ApiError(401, "Unauthorized");
  }

  const decoded = jwt.verify(clientRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
  if (!decoded) {
    throw new ApiError(401, "Invalid token");
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "No user found with this token");
  }

  if (user.refreshToken !== clientRefreshToken) { // db has encoded token as req
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
      new ApiResponse(200, "AccessToken generated successfully!", {accessToken, refreshToken})
    );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
