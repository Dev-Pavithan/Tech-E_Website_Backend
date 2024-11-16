// In middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log the error stack trace for debugging
  console.error(err.stack);

  // Determine the HTTP status code
  const statusCode = err.status || 500;

  // Create a response object with a consistent format
  const response = {
    error: {
      message: err.message || 'Internal Server Error',
      code: statusCode,
    },
  };

  // Optionally include the stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  // Send the response to the client
  res.status(statusCode).json(response);
};

export default errorHandler;
