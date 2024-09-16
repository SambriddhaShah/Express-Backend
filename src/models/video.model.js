import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema= new mongoose.Schema(
{
    videoFile: {
        type:String, //cloudnary url
        required: true
    },
    thumbmail: {
            type:String, //cloudnary url
            required: true
    },
    title: {
        type:String, 
        required:true
    },
    description: {
        type:String, 
        required:true
    },
    duration: {
        type:Number, //cloudnary duration
        required:true
    },
    views: {
        type:Number, 
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:'User'  //referring to User model
    }
   
}, {timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate);
export const Video= mongoose.model('Video', videoSchema)