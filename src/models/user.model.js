import mongoose, {Schema, SchemaTypes} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema= new mongoose.Schema(
    {
    username:{
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true,
        index:true,
        max: 15,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address'],  
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index:true,
    },
    avatar:{
         type: String, //cloudnary url
         required: true,
    },
    coverImage:{
        type: String, //cloudnary url
   },
   watchHistory:[
    {
        type:Schema.Types.ObjectId, 
        ref:"Video"
    }
   ],
   password:{
    type: String,
    required: [true, "Paaword is required"],
    minlength: 8,
    select: false, // this field will not be returned in the response by default
   },
   refreshToken:{
    type: String,
    select: false,  // this field will not be returned in the response by default
   }

}, {timestamps:true})

userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password, 10)
        next()
    }else{
        return next()
    }
    
})

userSchema.methods.isPasswordCorrect= async function (password){
    return await bcrypt.compare(password, this.password)
}
//jwt token generation

userSchema.methods.generateAccessToken= function (){
  return  jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
)
}
userSchema.methods,generateRefreshToken= function(){
   return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
)
}


export const User= mongoose.model("User", userSchema) 