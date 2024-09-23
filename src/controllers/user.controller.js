import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 
import jwt from "jsonwebtoken";

//JWT token generation function
const generateAccessAndRefreshToken= async(userId)=>{
    try{

        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        //add refreshToken to the user object
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
            $set:{
                refreshToken: undefined
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
    const user= await User.findById(decodedToken._id)
    if(!user ){
        throw new ApiError(401,"Not authorized, token is invalid")
    }

    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(401,"Not authorized, refresh token is expired or used")

    }

    const {accessToken, newrefreshToken}=await generateAccessAndRefreshToken(incomingRefreshToken, process.env.ACCESSION)

    const options={
        httpOnly: true,
        secure:true
    }

    return res.status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", newrefreshToken, options)
    .json(new ApiResponse(200,{"accessToken": accessToken, "refreshToken": newrefreshToken}, "sucessfully updated"))
   }catch(e){
    new ApiError(401, e.message||"Invalid refreshToken")
   }
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
