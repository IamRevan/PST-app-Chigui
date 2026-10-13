const asyncHandler = (fn, defaultErrorMessage = 'Error interno del servidor') => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((error) => {
    if (res.headersSent) {
      return next(error);
    }
    const status = error.status || error.statusCode || 500;
    const message = error.customMessage || defaultErrorMessage;
    res.status(status).json({ status: 'error', message });
  });
};

module.exports = asyncHandler;
