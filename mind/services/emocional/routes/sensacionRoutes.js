const express = require('express');
const router = express.Router();
const Joi = require('joi');

const SensacionController = require('../controllers/sensacionController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const sensacionSchema = Joi.object({
  idSensacion: Joi.number().integer().required(),
  nombre: Joi.string().required().trim().max(100),
  tipo: Joi.string().required().trim().max(50)
});

const updateSensacionSchema = Joi.object({
  idSensacion: Joi.number().integer(),
  nombre: Joi.string().trim().max(100),
  tipo: Joi.string().trim().max(50)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  tipo: Joi.string().trim()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  SensacionController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SensacionController.getById
);

router.get('/tipo/:tipo', 
  validate(Joi.object({ tipo: Joi.string().required() }), 'params'),
  AuthMiddleware.authenticate,
  SensacionController.getByType
);

router.post('/', 
  validate(sensacionSchema),
  AuthMiddleware.authenticate,
  SensacionController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateSensacionSchema),
  AuthMiddleware.authenticate,
  SensacionController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SensacionController.delete
);

module.exports = router;
