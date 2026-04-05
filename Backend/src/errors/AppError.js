export default class AppError extends Error {
  constructor(statusCode, message, fieldErrors = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}
