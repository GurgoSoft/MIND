const express = require('express');
const router = express.Router();
const TipoUsuarioController = require('../controllers/tipoUsuarioController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { body, param } = require('express-validator');
const ValidationMiddleware = require('../../../shared/middleware/validation');

// Validation rules
const createValidation = [
  body('codigo')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Código es requerido y debe tener entre 2 y 10 caracteres'),
  body('nombre')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre es requerido y debe tener entre 2 y 100 caracteres')
];

const updateValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido'),
  body('codigo')
    .optional()
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Código debe tener entre 2 y 10 caracteres'),
  body('nombre')
    .optional()
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido')
];

const codigoValidation = [
  param('codigo')
    .notEmpty()
    .trim()
    .withMessage('Código es requerido')
];

// Routes
router.get('/', AuthMiddleware.authenticate, TipoUsuarioController.getAll);
router.get('/:id', AuthMiddleware.authenticate, idValidation, ValidationMiddleware.handleValidationErrors, TipoUsuarioController.getById);
router.get('/codigo/:codigo', AuthMiddleware.authenticate, codigoValidation, ValidationMiddleware.handleValidationErrors, TipoUsuarioController.getByCodigo);
router.post('/', AuthMiddleware.authenticate, createValidation, ValidationMiddleware.handleValidationErrors, TipoUsuarioController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, ValidationMiddleware.handleValidationErrors, TipoUsuarioController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, ValidationMiddleware.handleValidationErrors, TipoUsuarioController.delete);

module.exports = router;
