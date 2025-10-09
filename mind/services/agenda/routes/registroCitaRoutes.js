const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const RegistroCitaController = require('../controllers/registroCitaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('citaId')
    .notEmpty()
    .withMessage('El ID de la cita es requerido')
    .isMongoId()
    .withMessage('El ID de la cita debe ser válido'),
  body('usuarioId')
    .notEmpty()
    .withMessage('El ID del usuario es requerido')
    .isMongoId()
    .withMessage('El ID del usuario debe ser válido'),
  body('accion')
    .notEmpty()
    .withMessage('La acción es requerida')
    .isIn(['creacion', 'modificacion', 'cancelacion', 'confirmacion', 'asistencia', 'inasistencia'])
    .withMessage('La acción debe ser: creacion, modificacion, cancelacion, confirmacion, asistencia o inasistencia'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('fechaRegistro')
    .optional()
    .isISO8601()
    .withMessage('La fecha de registro debe ser válida')
];

const updateValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  ...createValidation
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido')
];

const citaIdValidation = [
  param('citaId').isMongoId().withMessage('ID de cita inválido')
];

const usuarioIdValidation = [
  param('usuarioId').isMongoId().withMessage('ID de usuario inválido')
];

// Routes
router.get('/', AuthMiddleware.authenticate, RegistroCitaController.getAll);
router.get('/cita/:citaId', AuthMiddleware.authenticate, citaIdValidation, handleValidationErrors, RegistroCitaController.getByCita);
router.get('/usuario/:usuarioId', AuthMiddleware.authenticate, usuarioIdValidation, handleValidationErrors, RegistroCitaController.getByUsuario);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, RegistroCitaController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, RegistroCitaController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, RegistroCitaController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, RegistroCitaController.delete);

module.exports = router;
