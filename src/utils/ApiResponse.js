class ApiResponse {

    constructor(
        statuscode, 
        data, 
        message = "Success"
    ) {
        // 1. The constructor method takes three parameters:
        //    - statuscode: The HTTP status code of the response (e.g., 200 for success, 404 for not found).
        //    - data: The actual data to be returned with the response (can be an object, array, etc.).
        //    - message: A message describing the response (default is "Success").

        this.statusCode = statuscode;
        // 2. Set the `statusCode` property to the value of `statuscode` passed to the constructor.
        //    This represents the HTTP status code for the response.

        this.data = data;
        // 3. Set the `data` property to the value of `data` passed to the constructor.
        //    This holds the actual data you want to send back in the response.

        this.message = message;
        // 4. Set the `message` property to the value of `message` passed to the constructor, or the default "Success" if no message is provided.

        this.success = statuscode < 400;
        // 5. Set the `success` property to `true` if the status code is less than 400 (indicating success),
        //    otherwise set it to `false` (indicating an error). This is a simple way to flag whether the response is successful.
    }
}
