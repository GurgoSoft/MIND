const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios/Usuario');

class AuthMiddleware {
  // Generate JWT token
  static generateToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'mind-api'
      }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Authentication middleware
  static async authenticate(req, res, next) {
    try {
      // Check if JWT is disabled for development/testing
      if (process.env.JWT_DISABLED === 'true') {
        console.log(' JWT Authentication disabled for development');
        // Create a mock user for testing
        req.user = {
          _id: 'mock-user-id',
          email: 'test@example.com',
          activo: true
        };
        req.userId = 'mock-user-id';
        return next();
      }

      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido',
          error: 'UNAUTHORIZED'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado',
          error: 'UNAUTHORIZED'
        });
      }

      // Verify token
      const decoded = AuthMiddleware.verifyToken(token);
      
      // Get user from database
      const usuario = await Usuario.findById(decoded.userId)
        .populate('idPersona')
        .populate('idTipoUsuario');

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
          error: 'UNAUTHORIZED'
        });
      }

      if (!usuario.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo',
          error: 'UNAUTHORIZED'
        });
      }

      // Add user to request object
      req.user = usuario;
      req.userId = usuario._id;
      
      next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          error: 'INVALID_TOKEN'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          error: 'EXPIRED_TOKEN'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  // Authorization middleware - check user permissions
  static authorize(requiredAccess = []) {
    return async (req, res, next) => {
      try {
        
        if (!requiredAccess.length) {
          return next();
        }
        next();
      } catch (error) {
        console.error('Error en autorización:', error);
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado',
          error: 'FORBIDDEN'
        });
      }
    };
  }
}

module.exports = AuthMiddleware;
