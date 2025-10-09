const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const TipoSuscripcionController = require('../controllers/tipoSuscripcionController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const createValidation = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
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

// Routes
router.get('/', AuthMiddleware.authenticate, TipoSuscripcionController.getAll);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, TipoSuscripcionController.getById);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, TipoSuscripcionController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, TipoSuscripcionController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, TipoSuscripcionController.delete);

module.exports = router;
