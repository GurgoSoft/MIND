const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const DiarioSensacionController = require('../controllers/diarioSensacionController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('diarioId')
    .notEmpty()
    .withMessage('El ID del diario es requerido')
    .isMongoId()
    .withMessage('El ID del diario debe ser válido'),
  body('sensacionId')
    .notEmpty()
    .withMessage('El ID de la sensación es requerido')
    .isMongoId()
    .withMessage('El ID de la sensación debe ser válido'),
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
router.get('/', AuthMiddleware.authenticate, DiarioSensacionController.getAll);
router.get('/diario/:diarioId', AuthMiddleware.authenticate, diarioIdValidation, handleValidationErrors, DiarioSensacionController.getByDiario);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, DiarioSensacionController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, DiarioSensacionController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, DiarioSensacionController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, DiarioSensacionController.delete);

module.exports = router;
