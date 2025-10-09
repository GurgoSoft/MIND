const express = require('express');
const router = express.Router();
const InformacionPagoController = require('../controllers/informacionPagoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation rules
const createValidation = [
  body('idUsuario')
    .isMongoId()
    .withMessage('ID de usuario debe ser un ObjectId válido'),
  body('proveedor')
    .isIn(['stripe', 'paypal', 'mercadopago', 'wompi', 'payu'])
    .withMessage('Proveedor debe ser uno de: stripe, paypal, mercadopago, wompi, payu'),
  body('customerId')
    .notEmpty()
    .trim()
    .withMessage('Customer ID es requerido'),
  body('metodoPago')
    .optional()
    .isIn(['card', 'bank_transfer', 'digital_wallet'])
    .withMessage('Método de pago debe ser uno de: card, bank_transfer, digital_wallet'),
  body('ultimaTransaccion')
    .optional()
    .isISO8601()
    .withMessage('Última transacción debe ser una fecha válida'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser un booleano')
];

const updateValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido'),
  body('proveedor')
    .optional()
    .isIn(['stripe', 'paypal', 'mercadopago', 'wompi', 'payu'])
    .withMessage('Proveedor debe ser uno de: stripe, paypal, mercadopago, wompi, payu'),
  body('customerId')
    .optional()
    .notEmpty()
    .trim()
    .withMessage('Customer ID no puede estar vacío'),
  body('metodoPago')
    .optional()
    .isIn(['card', 'bank_transfer', 'digital_wallet'])
    .withMessage('Método de pago debe ser uno de: card, bank_transfer, digital_wallet'),
  body('ultimaTransaccion')
    .optional()
    .isISO8601()
    .withMessage('Última transacción debe ser una fecha válida'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser un booleano')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido')
];

const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('ID de usuario debe ser un ObjectId válido')
];

// Routes
router.get('/', AuthMiddleware.authenticate, InformacionPagoController.getAll);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, InformacionPagoController.getById);
router.get('/usuario/:userId', AuthMiddleware.authenticate, userIdValidation, handleValidationErrors, InformacionPagoController.getByUserId);
router.post('/', AuthMiddleware.authenticate, createValidation, handleValidationErrors, InformacionPagoController.create);
router.put('/:id', AuthMiddleware.authenticate, updateValidation, handleValidationErrors, InformacionPagoController.update);
router.delete('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, InformacionPagoController.delete);

module.exports = router;
