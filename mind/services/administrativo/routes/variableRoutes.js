const express = require('express');
const router = express.Router();
const Joi = require('joi');

const VariableController = require('../controllers/variableController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const variableSchema = Joi.object({
  idTipoVariable: commonSchemas.objectId,
  clave: Joi.string().required().trim().max(100),
  valor: Joi.any().required(),
  ambiente: Joi.string().valid('development', 'staging', 'production').default('development'),
  descripcion: Joi.string().trim().max(500)
});

const updateVariableSchema = Joi.object({
  idTipoVariable: commonSchemas.objectId,
  clave: Joi.string().trim().max(100),
  valor: Joi.any(),
  ambiente: Joi.string().valid('development', 'staging', 'production'),
  descripcion: Joi.string().trim().max(500)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  ambiente: Joi.string().valid('development', 'staging', 'production')
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  VariableController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  VariableController.getById
);

router.post('/', 
  validate(variableSchema),
  AuthMiddleware.authenticate,
  VariableController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateVariableSchema),
  AuthMiddleware.authenticate,
  VariableController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  VariableController.delete
);

router.get('/environment/:ambiente', 
  validate(Joi.object({ ambiente: Joi.string().valid('development', 'staging', 'production') }), 'params'),
  AuthMiddleware.authenticate,
  VariableController.getByEnvironment
);

module.exports = router;
