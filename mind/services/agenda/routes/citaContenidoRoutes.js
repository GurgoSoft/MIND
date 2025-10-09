const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const CitaContenidoController = require('../controllers/citaContenidoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('citaId')
    .notEmpty()
    .withMessage('El ID de la cita es requerido')
    .isMongoId()
    .withMessage('El ID de la cita debe ser válido'),
  body('tipo')
    .notEmpty()
    .withMessage('El tipo es requerido')
    .isIn(['nota', 'archivo', 'imagen'])
    .withMessage('El tipo debe ser: nota, archivo o imagen'),
  body('contenido')
    .notEmpty()
    .withMessage('El contenido es requerido'),
  body('fechaCreacion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de creación debe ser válida')
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

// Routes
router.get('/', AuthMiddleware.authenticate, CitaContenidoController.getAll);
router.get('/cita/:citaId', AuthMiddleware.authenticate, citaIdValidation, handleValidationErrors, CitaContenidoController.getByCita);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, CitaContenidoController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, CitaContenidoController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, CitaContenidoController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, CitaContenidoController.delete);

module.exports = router;
