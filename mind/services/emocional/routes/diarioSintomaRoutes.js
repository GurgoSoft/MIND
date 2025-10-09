const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const DiarioSintomaController = require('../controllers/diarioSintomaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('diarioId')
    .notEmpty()
    .withMessage('El ID del diario es requerido')
    .isMongoId()
    .withMessage('El ID del diario debe ser válido'),
  body('sintomaId')
    .notEmpty()
    .withMessage('El ID del síntoma es requerido')
    .isMongoId()
    .withMessage('El ID del síntoma debe ser válido'),
  body('intensidad')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('La intensidad debe ser un número entre 1 y 10'),
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

const diarioIdValidation = [
  param('diarioId').isMongoId().withMessage('ID de diario inválido')
];

// Routes
router.get('/', AuthMiddleware.authenticate, DiarioSintomaController.getAll);
router.get('/diario/:diarioId', AuthMiddleware.authenticate, diarioIdValidation, handleValidationErrors, DiarioSintomaController.getByDiario);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, DiarioSintomaController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, DiarioSintomaController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, DiarioSintomaController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, DiarioSintomaController.delete);

module.exports = router;
