import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"
export const verifyJWT = asyncHandler(async (req, res, next)=>{
   try{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    // console.log(`the token ${req.cookies}`)
    if(!token){
        throw new ApiError("401","Not authorized, token is missing")
    }

    //check if the token is valid
    const decodedToken=  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user= await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!user){
        throw new ApiError("401","Not authorized, token is invalid")
    }
    req.user=user
    next()

   }
   catch(err){
    throw new ApiError(401, err.message || "Invalid access token")
   }
})