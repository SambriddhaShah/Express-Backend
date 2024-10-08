import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { deleteOldFiles, uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 
import jwt from "jsonwebtoken";

//JWT token generation function
const generateAccessAndRefreshToken= async(userId)=>{
    try{

        const user= await User.findById(userId).select("+refreshToken")
        const accessToken= user.generateAccessToken()
        console.log(`the access token is ${accessToken}`)
        const refreshToken = user.generateRefreshToken()
        console.log(`the refresh token is ${refreshToken}`)
        // add refreshToken to the user object
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}

    }catch{
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser= asyncHandler( async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    const {fullName, email, password, username} = req.body
    // console.log('email', email)

    // if(fullName===""){
    //     throw new ApiError(400, "Fullname is required")
    // }

    //validation of fileds for null
    if([fullName, email, password, username].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exists
     const existantUser= await User.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(existantUser){
        throw new ApiError(409, "Email or Username already exists")
    }

    //check for files

    const avaratrLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
       { coverImageLocalPath = req.files?.coverImage[0]?.path;
     

    }

    //check fot avatar if it has come or not

    if(!avaratrLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    //upload the files on cloudinary server

    const avatar= await uploadOnCloudinary(avaratrLocalPath);
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    //check if avatar has been uploaded or not

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar")
    }

    //create a user model and upload it on the database

    const user = await User.create({
        fullName, 
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    //checking if the user is created successfully and dleeting the unwanted fields
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Failed to create user")
    }

    //sending the response using the ApiResposne class

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User Created Sucessfully")
    )

})

const loginUser=asyncHandler(async (req, res) => {

    //take data from the req.bosy
    const{email, username, password}= req.body

    //check if email or username
    if(
        !(email || username)
        // !username && !email
    ){
        throw new ApiError(400, "Email or Username is required")
    }

    //find a userby email or username
    const user = await User.findOne({
        $or:[
            {username},
            {email}
        ]
    }).select("+password")
    console.log(user)

    //check if user not found
    if(!user){
        throw new ApiError(404, "User not found")
    }

    //check password of the database and user
    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials")
    }

    //generate the JWT token
    const {accessToken, refreshToken}= await generateAccessAndRefreshToken(user._id)

    //fetch the new user data 
    const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

    //send in cookies
    const options={
        httpOnly: true,
        secure:true
    }
    
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200,
        {
            user:loggedInUser, 
            accessToken, 
            refreshToken
        },
        "User Logged in successfully"
    ))
})

const logoutUser= asyncHandler(async(req,res)=>{

     //remove the token from database
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset:{
                refreshToken:1  //removes the token
            }

        }
    )
    //remove the token from cookies
    const options ={
        httpOnly: true,
        secure: true,
    }
    return res.status(200).
    clearCookie("accessToken", options).
    clearCookie("refreshToken", options).
    json(new ApiResponse(200, null, "User Logged out successfully"))

})

const refreshAccessToken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies?.refreshToken || req.body.refreshToken
  

    if(!incomingRefreshToken){
        throw new ApiError(401, "Not authorized, token is missing")
    }
    //check if the refreshToken is valid
   try{

    const decodedToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user= await User.findById(decodedToken._id).select("+refreshToken")
 
    if(!user){
        throw new ApiError(401,"Not authorized, token is invalid")
    }
    // console.log('hello')
    // console.log(`the value is${incomingRefreshToken !== user.refreshToken}`)
    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(401,"Not authorized, refresh token is expired or used")
    }

    const {accessToken, refreshToken}= await generateAccessAndRefreshToken(user._id)
    console.log(`the accessToken is ${accessToken} and the refreshToken is ${refreshToken}`)
    const options={
        httpOnly: true,
        secure:true
    }

    return res.status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200,{"accessToken": accessToken, "refreshToken": refreshToken}, "sucessfully updated"))
   }catch(e){
    new ApiError(401, e.message||"Invalid refreshToken")
   }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const {oldPassword, newPassword}=req.body
    const user= await User.findById(req.user._id).select("+password")
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid Password")
    }
    //updating the password
    user.password= newPassword
    await user.save({validateBeforeSave:false})
     res.json(new ApiResponse(200,{},'Password updated successfully'))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
   
    return res.status(200).json(new ApiResponse(200,req.user, "Current User"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email, username }=req.body

    if(!fullName || !email || !username){
        throw new ApiError(400, "Full Name, Username and Email are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{fullName:fullName, email:email, username:username}
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user, "Account Details Updated, Sucessfully"))
    
})

const updateAvatar= asyncHandler(async(req,res)=>{
   const avatarLocalPath= req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is required")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
    throw new ApiError(500, "Failed to upload avatar")
   }
   console.log(`the avatar is ${req.user.avatar}`)
   await deleteOldFiles(req.user.avatar)
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set:{avatar: avatar.url}
   }, {new: true}).select("-passowrd -refreshToken")
   user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, user, "Avatar Updated Sucessfully"))
 
})

const updateCoverImage= asyncHandler(async(req,res)=>{
    const CoverImageLocalPath= req.file?.path
 
    if(!CoverImageLocalPath){
     throw new ApiError(400, "CoverImage is required")
    }
    const coverImage = await uploadOnCloudinary(CoverImageLocalPath)
    if(!coverImage.url){
     throw new ApiError(500, "Failed to upload coverImage")
    }
    await deleteOldFiles(req.user.coverImage)
   const user = await User.findByIdAndUpdate(req.user._id, {
     $set:{coverImage: coverImage.url}
    }, {new: true}).select("-passowrd -refreshToken")
    user.save({validateBeforeSave: false})
 
   return res.status(200).json(new ApiResponse(200, user, "CoverImage Updated Sucessfully"))
 })

const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const username= req.params.username

    if(!username?.trim){
        throw new ApiError(400, "Username is required")
    }
    //aggeration pipeline for getting channel details
    const channel= await User.aggregate(
        [
            {
            $match: {
                username: username.trim().toLowerCase() 
            }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"

                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    subscribedToCount:{
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }

                }
            },
            {
                $project:{
                    username:1,
                    avatar:1,
                    coverImage:1,
                    fullName:1,
                    isSubscribed:1,
                    subscribersCount:1,
                    subscribedToCount:1,
                    email:1
                }
            }

        ])
    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist")
    }
    
    return res.status(200).json(new ApiResponse(200, channel[0], "User Channel Details"))
    
}) 

const getUserWatchHistory = asyncHandler(async(req,res)=>{
    //we get string from re.user._id not the object as mongoose changes it to string
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1,

                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $arrayElemAt:["$owner", 0]
                                //$first:"$owner"
                            }
                        }
                    }
                ]
            },

        },

    ])

    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "User Watch History fetched Sucessfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}
