import AppError from '../errors/AppError.js';

export function notFoundHandler(request, _response, next) {
  next(new AppError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode ?? 500;
  const message = error.message ?? 'Internal server error';

  response.status(statusCode).json({
    timestamp: new Date().toISOString(),
    status: statusCode,
    error: statusCode === 404 ? 'Not Found' : statusCode === 400 ? 'Bad Request' : 'Internal Server Error',
    message,
    fieldErrors: error.fieldErrors ?? {},
  });
}
