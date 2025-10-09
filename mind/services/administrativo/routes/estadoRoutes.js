const express = require('express');
const router = express.Router();
const Joi = require('joi');

const EstadoController = require('../controllers/estadoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const estadoSchema = Joi.object({
  codigo: Joi.string().required().trim().max(10),
  nombre: Joi.string().required().trim().max(100),
  color: Joi.string().pattern(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  simbolo: Joi.string().trim().max(5).allow('', null),
  descripcion: Joi.string().trim().max(500).allow('', null),
  visible: Joi.boolean().optional(),
  modulo: Joi.string().trim().max(50).optional()
});

const updateEstadoSchema = Joi.object({
  codigo: Joi.string().trim().max(10),
  nombre: Joi.string().trim().max(100),
  color: Joi.string().pattern(/^#([0-9a-fA-F]{3}){1,2}$/),
  simbolo: Joi.string().trim().max(5).allow('', null),
  descripcion: Joi.string().trim().max(500).allow('', null),
  visible: Joi.boolean().optional(),
  modulo: Joi.string().trim().max(50).optional()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  nombre: Joi.string().trim().optional(),
  simbolo: Joi.string().trim().optional(),
  modulo: Joi.string().trim().optional(),
  visible: Joi.boolean().optional()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  EstadoController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  EstadoController.getById
);

router.post('/', 
  validate(estadoSchema),
  AuthMiddleware.authenticate,
  EstadoController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateEstadoSchema),
  AuthMiddleware.authenticate,
  EstadoController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  EstadoController.delete
);

module.exports = router;
