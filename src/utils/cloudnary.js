import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { pathToFileURL } from 'url';


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDNARY_NAME, 
        api_key: process.env.CLOUDNARY_API_KEY, 
        api_secret: process.env.CLOUDNARY_API_SECRET 
    });


    // Upload files to Cloudinary

    const uploadOnCloudinary = async (localFilePath)=>{
        try{
            if(!localFilePath){
                return null;
            }else{
                //uploading the file now 
               const response = await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})
                //sucessfully uploaded
                // console.log(`file has been uploaded in Cloudinary with respone ${response.url}`)
                fs.unlinkSync(localFilePath);
                return response;
            }

        }catch(e){
            fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload opeartion git failed
            return null;
        }
    }

    const deleteOldFiles= async(pathToFileURL)=>{
        try{
            if(!pathToFileURL){
                return null;
            }else{
                const fileId = pathToFileURL.pathname.split('/')[3];
                await cloudinary.uploader.destroy(fileId)
                return true;
            }
        }catch(e){
            return null;
        }
    }

    export {
        uploadOnCloudinary,
        deleteOldFiles
        

    }
   

    
