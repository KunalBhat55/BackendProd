class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [] , stack = "") {

    super(message) // getting message from Error class
    
    this.statusCode = statusCode; 
    this.data = null; 
    this.message = message;
    this.success = false;
    this.error = errors;
 
    if (stack) { 
      this.stack = stack; 
    } else {
      Error.captureStackTrace(this, this.constructor); // this line is used to capture the stack trace of the error object
    }
  }
}
export { ApiError };


