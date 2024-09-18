import dotenv from 'dotenv'
import mongoose from 'mongoose'
// import {DB_NAME} from '../constants.js'
import connectDB from './db/index.js'
import { app } from './app.js'

dotenv.config({
    path: './.env'

})

connectDB()
.then(
    app.listen(process.env.PORT,()=>{
      console.log(  `Server running on port ${process.env.PORT}`)
    })

)
.catch((err)=>{
    console.log('MongoDb connection failed: ' + err)
})

/*
import express from 'express'
const app = express()

// iffe's function 
;(async()=>{
    try{
       await mongoose.connect(`${process.env.MONGODBURI}/${DB_NAME}`)
        app.on('error',(error)=>{
            console.error('MongoDB connection error for appl:', error)
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    }catch(error){
        console.error('Error connecting to MongoDB:', error)
        process.exit(1)
    }
})()
*/

