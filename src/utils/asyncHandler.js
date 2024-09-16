const asyncHandler = (requestHandler) => {
    // 1. Define a function called asyncHandler that takes another function (requestHandler) as a parameter.
    //    This function is expected to be an asynchronous request handler (e.g., a controller function).

    return (req, res, next) => {
        // 2. Return a new function that takes in three parameters: req (the request object), 
        //    res (the response object), and next (the next middleware function in the Express stack).
        
        Promise.resolve(requestHandler(req, res, next))
        // 3. Inside the returned function, wrap the requestHandler in a promise using Promise.resolve.
        //    This ensures that the requestHandler is treated as a promise, whether it returns a promise or not.

        .catch((err) => next(err));
        // 4. If the promise is rejected (i.e., the requestHandler throws an error or rejects),
        //    catch the error and pass it to the next() function, which forwards it to the error-handling middleware.
    };
};



export {asyncHandler} 



// // Try/catch all async handlers
// const asyncHandler=(fn)=> async (req,res,next)=>{
//  try{
//     await fn(req,res,next)

//  }catch(err){
//     res.status(err.code||500).json({sucess:false, message: err.message})
//  }
// }