import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponce } from "../utils/apiResponce.js";

const generateAccessAndRefreshTokens = async(userId) => {
  try {
  const user =  await User.findById(userId)
 const assessToken  = user.generateAccessToken()
 const refreshToken = user.generateRefreshToken()

user.refreshToken = refreshToken
 await user.save({validateBeforeSave: false})


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

    if (!username || !email) {
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
})


export {
  registerUser,
  loginUser
}