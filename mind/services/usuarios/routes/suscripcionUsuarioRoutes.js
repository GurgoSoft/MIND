const express = require('express');
const router = express.Router();
const Joi = require('joi');

const UsuarioSuscripcionController = require('../controllers/usuarioSuscripcionController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const suscripcionUsuarioSchema = Joi.object({
  idUsuario: commonSchemas.objectId,
  idSuscripcion: commonSchemas.objectId,
  fechaInicio: Joi.date().default(Date.now),
  fechaFin: Joi.date().required(),
  estado: Joi.string().valid('activa', 'pausada', 'cancelada', 'expirada').default('activa'),
  renovacionAutomatica: Joi.boolean().default(true)
});

const updateSuscripcionUsuarioSchema = Joi.object({
  idSuscripcion: commonSchemas.objectId,
  fechaInicio: Joi.date(),
  fechaFin: Joi.date(),
  estado: Joi.string().valid('activa', 'pausada', 'cancelada', 'expirada'),
  renovacionAutomatica: Joi.boolean()
});

const informacionPagoSchema = Joi.object({
  proveedor: Joi.string().valid('stripe', 'paypal', 'mercadopago', 'wompi', 'payu').default('stripe'),
  customerId: Joi.string().required().trim(),
  metodoPago: Joi.string().valid('card', 'bank_transfer', 'digital_wallet').default('card'),
  ultimaTransaccion: Joi.date(),
  activo: Joi.boolean().default(true)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  estado: Joi.string().valid('activa', 'pausada', 'cancelada', 'expirada'),
  idUsuario: commonSchemas.objectId
});

const expiringQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(7)
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.getAll
);

router.get('/stats', 
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.getStats
);

router.get('/expiring', 
  validate(expiringQuerySchema, 'query'),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.getExpiringSubscriptions
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.getById
);

router.get('/user/:idUsuario/active', 
  validate(Joi.object({ idUsuario: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.getUserActiveSubscriptions
);

router.post('/', 
  validate(suscripcionUsuarioSchema),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateSuscripcionUsuarioSchema),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.update
);

router.patch('/:id/cancel', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.cancel
);

router.patch('/:id/reactivate', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.reactivate
);

router.post('/user/:idUsuario/payment', 
  validate(Joi.object({ idUsuario: commonSchemas.objectId }), 'params'),
  validate(informacionPagoSchema),
  AuthMiddleware.authenticate,
  UsuarioSuscripcionController.setupPayment
);

module.exports = router;
