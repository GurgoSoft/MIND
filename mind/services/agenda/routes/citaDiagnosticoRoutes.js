const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const CitaDiagnosticoController = require('../controllers/citaDiagnosticoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('citaId')
    .notEmpty()
    .withMessage('El ID de la cita es requerido')
    .isMongoId()
    .withMessage('El ID de la cita debe ser válido'),
  body('tipoDiagnosticoId')
    .notEmpty()
    .withMessage('El ID del tipo de diagnóstico es requerido')
    .isMongoId()
    .withMessage('El ID del tipo de diagnóstico debe ser válido'),
  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 5, max: 1000 })
    .withMessage('La descripción debe tener entre 5 y 1000 caracteres'),
  body('observaciones')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Las observaciones no pueden exceder 2000 caracteres'),
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
router.get('/', AuthMiddleware.authenticate, CitaDiagnosticoController.getAll);
router.get('/cita/:citaId', AuthMiddleware.authenticate, citaIdValidation, handleValidationErrors, CitaDiagnosticoController.getByCita);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, CitaDiagnosticoController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, CitaDiagnosticoController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, CitaDiagnosticoController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, CitaDiagnosticoController.delete);

module.exports = router;
