const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const AgendaDiaController = require('../controllers/agendaDiaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('agendaId')
    .notEmpty()
    .withMessage('El ID de la agenda es requerido')
    .isMongoId()
    .withMessage('El ID de la agenda debe ser válido'),
  body('fecha')
    .notEmpty()
    .withMessage('La fecha es requerida')
    .isISO8601()
    .withMessage('La fecha debe ser válida'),
  body('horaInicio')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de inicio debe tener formato HH:MM'),
  body('horaFin')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de fin debe tener formato HH:MM'),
  body('disponible')
    .optional()
    .isBoolean()
    .withMessage('Disponible debe ser verdadero o falso')
];

const updateValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  ...createValidation
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido')
];

const agendaIdValidation = [
  param('agendaId').isMongoId().withMessage('ID de agenda inválido')
];

// Routes
router.get('/', AuthMiddleware.authenticate, AgendaDiaController.getAll);
router.get('/agenda/:agendaId', AuthMiddleware.authenticate, agendaIdValidation, handleValidationErrors, AgendaDiaController.getByAgenda);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, AgendaDiaController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, AgendaDiaController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, AgendaDiaController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, AgendaDiaController.delete);

module.exports = router;
