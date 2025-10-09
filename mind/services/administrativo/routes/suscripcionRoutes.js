const express = require('express');
const router = express.Router();
const Joi = require('joi');

const SuscripcionController = require('../controllers/suscripcionController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const suscripcionSchema = Joi.object({
  idTipoSuscripcion: commonSchemas.objectId,
  nombrePlan: Joi.string().required().trim().max(100),
  precio: Joi.number().required().min(0),
  periodicidad: Joi.string().valid('mensual', 'trimestral', 'semestral', 'anual').default('mensual'),
  activo: Joi.boolean().default(true)
});

const updateSuscripcionSchema = Joi.object({
  idTipoSuscripcion: commonSchemas.objectId,
  nombrePlan: Joi.string().trim().max(100),
  precio: Joi.number().min(0),
  periodicidad: Joi.string().valid('mensual', 'trimestral', 'semestral', 'anual'),
  activo: Joi.boolean()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  activo: Joi.boolean()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  SuscripcionController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SuscripcionController.getById
);

router.post('/', 
  validate(suscripcionSchema),
  AuthMiddleware.authenticate,
  SuscripcionController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateSuscripcionSchema),
  AuthMiddleware.authenticate,
  SuscripcionController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SuscripcionController.delete
);

router.patch('/:id/toggle-active', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SuscripcionController.toggleActive
);

module.exports = router;
