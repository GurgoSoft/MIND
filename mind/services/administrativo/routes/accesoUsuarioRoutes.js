const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const AccesoUsuarioController = require('../controllers/accesoUsuarioController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('usuarioId')
    .notEmpty()
    .withMessage('El ID del usuario es requerido')
    .isMongoId()
    .withMessage('El ID del usuario debe ser válido'),
  body('accesoId')
    .notEmpty()
    .withMessage('El ID del acceso es requerido')
    .isMongoId()
    .withMessage('El ID del acceso debe ser válido'),
  body('fechaAsignacion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de asignación debe ser válida'),
  body('fechaVencimiento')
    .optional()
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser válida'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El estado activo debe ser verdadero o falso')
];

const updateValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  ...createValidation
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido')
];

const usuarioIdValidation = [
  param('usuarioId').isMongoId().withMessage('ID de usuario inválido')
];

// Routes
router.get('/', AuthMiddleware.authenticate, AccesoUsuarioController.getAll);
router.get('/usuario/:usuarioId', AuthMiddleware.authenticate, usuarioIdValidation, handleValidationErrors, AccesoUsuarioController.getByUsuario);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, AccesoUsuarioController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, AccesoUsuarioController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, AccesoUsuarioController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, AccesoUsuarioController.delete);

module.exports = router;
