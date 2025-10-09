class ErrorHandler {
  static notFound(req, res, next) {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
  }

  static handle(error, req, res, next) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Error interno del servidor';

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      statusCode = 400;
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(statusCode).json({
        success: false,
        message: 'Error de validación',
        errors: errors
      });
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      statusCode = 400;
      const field = Object.keys(error.keyValue)[0];
      message = `El ${field} ya existe`;
      
      return res.status(statusCode).json({
        success: false,
        message: message,
        error: 'DUPLICATE_KEY'
      });
    }

    // Mongoose cast error
    if (error.name === 'CastError') {
      statusCode = 400;
      message = 'ID de recurso inválido';
      
      return res.status(statusCode).json({
        success: false,
        message: message,
        error: 'INVALID_ID'
      });
    }

    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error Stack:', error.stack);
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  }
}

module.exports = ErrorHandler;
