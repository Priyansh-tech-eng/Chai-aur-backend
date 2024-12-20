import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponce } from "../utils/apiResponce.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
  try {
  const user =  await User.findById(userId)
 const accessToken  = user.generateAccessToken()
 const refreshToken = user.generateRefreshToken()

user.refreshToken = refreshToken
 await user.save({validateBeforeSave: false})

 return {accessToken, refreshToken}


  } catch (error) {
    throw new apiError(500, "Somthing went wrong  while generating refresh and access token")
  }
}

const registerUser = asyncHandler( async (req, res) => {
     // get user detali from frontend
     // validation - not empty
     // check if user already exists: username, email
     // check for images, check for avatar
     // upload them to cloudinary, avatar
     // cereate user object - create entry in db
     //remove password and refresh token field from respose
     // check for user creation
     //return res


   const {fullName, email, username, password } = req.body 
   console.log("email: ", email);

   if (
     [fullName, email, username, password].some((field) =>
        field?.trim() === "") 
   ) {
      throw new apiError(400, "All fields are required")
   }

  const existedUser = await User.findOne({
    $or: [{username}, {email}]
   })

   if (existedUser) {
    throw new apiError(409, "User with email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
   }

   if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required")
   } 

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
    throw new apiError(400, "Avatar file is required")
   }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
   })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new apiError(500, "Somthing went wrong while registring the user")
  }

  return res.status(201).json(
    new apiResponce(200, createdUser, "User registered successfully")
  )

} )

const loginUser = asyncHandler(async (req, res ) =>{
    // req body -> data
    // username or email 
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {email, username, password} = req.body

    if (!username && !email) {
      throw new apiError(400, "username or password is required")
    }

   const user = await User.findOne({
      $or: [{username}, {email}]
    })
    if (!user) {
      throw new apiError(404," User does not exist")
      
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new apiError(401," Invalid user credentials")
    
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

 const loggedInUser  = await User.findById(user._id).
 select("-password -refreshToken")

 const options = {
  httpOnly: true,
  secure: true
 }

 return res
 .status(200)
 .cookie("accessToken", accessToken, options) // Set access token
 .cookie("refreshToken", refreshToken, options) // Set refresh token
 .json(
   new apiResponce(
     200,
     {
       user: loggedInUser,
       accessToken,
       refreshToken
     },
     "User logged in successfully"
   )
 );

})

const logoutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
   )
   const options = {
    httpOnly: true,
    secure: true
   }

   return res.status(200)
   .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new apiResponce(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshAccessToken

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request")
  }

 try {
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
 
  const user = await User.findById(decodedToken?._id)
 
  if (!user) {
   throw new apiError(401, "Invalid refresh token")
  }
 
  if (incomingRefreshToken !== user?.refreshToken) {
   throw new apiError(401, "Refresh token is expired or used")
  }
 
  const options = {
   httpOnly: true,
   secure: true
  }
 
 const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newRefreshToken, options)
  .json(
   new apiResponce(
     200,
   {accessToken, refreshToken: newRefreshToken},
   "Access token refreshed"
   )
  )
 
 } catch (error) {
  throw new apiError(401, error?.message || "Invalid refresh token")
 }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

 if (!isPasswordCorrect) {
  throw new apiError(400, "invalid old password")
 }

 user.password = newPassword
await user.save({validateBeforeSave: false})

return res
.status(200)
.json(new apiResponce(200, {}, "Password change successfuly"))

})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fatched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body

  if (!fullName || !email) {
    throw new apiError(400, "All fields are required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new apiError(200, user, "Account details update successsfuly"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing")
  }

 const avatar =  await uploadOnCloudinary(avatarLocalPath)

 if (!avatar.url) {
  throw new apiError(400, "error while uploading on avatar")
 }

 const user = await User.findByIdAndDelete(
  req.user?._id,

  {
    $set:{
      avatar: avatar.url
    }
  },
  {new: true}
 ).select("-password")

 return res
 .status(200)
 .json(
  new apiResponce(200, user, "Avatar image uploded succesfuly")
 )
})


const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new apiError(400, "Cover image file is missing")
  }

 const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

 if (!coverImage.url) {
  throw new apiError(400, "error while uploading on cover imnage")
 }

const user = await User.findByIdAndUpdate(
  req.user?._id,

  {
    $set:{
      coverImage: coverImage.url
    }
  },
  {new: true}
 ).select("-password")

 return res
 .status(200)
 .json(
  new apiResponce(200, user, "Cover image uploded succesfuly")
 )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage

}