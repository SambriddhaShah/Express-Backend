class ApiError extends Error {
    // 1. Define a class named ApiError that extends the built-in Error class.
    //    This allows us to create custom error types with additional properties.

    constructor(
        statusCode, 
        message = 'Something went wrong', 
        errors = [], 
        stack = ""
    ) {
        // 2. The constructor method takes four parameters:
        //    - statusCode: The HTTP status code (e.g., 404, 500) associated with the error.
        //    - message: The error message (default is 'Something went wrong').
        //    - errors: An array to store additional error details (default is an empty array).
        //    - stack: Optionally, a custom stack trace (default is an empty string).
        
        super(message);
        // 3. Call the parent class's constructor (Error) with the message. 
        //    This sets the message property inherited from Error.

        this.statusCode = statusCode;
        // 4. Assign the statusCode property to the instance for tracking the HTTP status code of the error.

        this.data = null;
        // 5. Set a property `data` to null. This can later be used to attach any relevant data to the error.

        this.errors = errors;
        // 6. Assign the errors array to the instance. This array can hold additional error details (e.g., validation errors).

        this.message = message;
        // 7. Explicitly assign the message again (although this is already handled by the parent class).
        //    This can be useful if you want to ensure consistent handling.

        this.success = false;
        // 8. Set a `success` flag to false, indicating that the operation was not successful.

        if (stack) {
            this.stack = stack;
            // 9. If a custom stack trace is provided, assign it to the stack property.
        } else {
            Error.captureStackTrace(this, this.constructor);
            // 10. If no custom stack trace is provided, generate one using Error.captureStackTrace.
            //     This helps in debugging by capturing where the error occurred.
        }
    }
}

export { ApiError };
// 11. Export the ApiError class so it can be imported and used in other parts of the application.
