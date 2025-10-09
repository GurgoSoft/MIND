const express = require('express');
const router = express.Router();
const UsuarioAuditoriaController = require('../controllers/usuarioAuditoriaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { param, query } = require('express-validator');
const ValidationMiddleware = require('../../../shared/middleware/validation');

// Validation rules
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido')
];

const entityValidation = [
  param('entidad')
    .notEmpty()
    .trim()
    .withMessage('Entidad es requerida'),
  param('idEntidad')
    .isMongoId()
    .withMessage('ID de entidad debe ser un ObjectId válido')
];

const userValidation = [
  param('usuarioId')
    .isMongoId()
    .withMessage('ID de usuario debe ser un ObjectId válido')
];

const cleanupValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage('Días debe ser un número entero entre 1 y 3650')
];

// Routes
router.get('/', AuthMiddleware.authenticate, UsuarioAuditoriaController.getAll);
router.get('/stats', AuthMiddleware.authenticate, UsuarioAuditoriaController.getStats);
router.get('/:id', AuthMiddleware.authenticate, idValidation, ValidationMiddleware.handleValidationErrors, UsuarioAuditoriaController.getById);
router.get('/entidad/:entidad/:idEntidad', AuthMiddleware.authenticate, entityValidation, ValidationMiddleware.handleValidationErrors, UsuarioAuditoriaController.getByEntity);
router.get('/usuario/:usuarioId', AuthMiddleware.authenticate, userValidation, ValidationMiddleware.handleValidationErrors, UsuarioAuditoriaController.getByUser);
router.delete('/cleanup', AuthMiddleware.authenticate, cleanupValidation, ValidationMiddleware.handleValidationErrors, UsuarioAuditoriaController.cleanup);

module.exports = router;
