import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 

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



export {registerUser}
