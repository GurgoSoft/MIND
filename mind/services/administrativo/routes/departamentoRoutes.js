const express = require('express');
const router = express.Router();
const Joi = require('joi');

const DepartamentoController = require('../controllers/departamentoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const departamentoSchema = Joi.object({
  idPais: commonSchemas.objectId,
  nombre: Joi.string().required().trim().max(100),
  codigoDANE: Joi.string().required().trim().max(10)
});

const updateDepartamentoSchema = Joi.object({
  idPais: commonSchemas.objectId,
  nombre: Joi.string().trim().max(100),
  codigoDANE: Joi.string().trim().max(10)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  idPais: commonSchemas.objectId
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  DepartamentoController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  DepartamentoController.getById
);

router.post('/', 
  validate(departamentoSchema),
  AuthMiddleware.authenticate,
  DepartamentoController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateDepartamentoSchema),
  AuthMiddleware.authenticate,
  DepartamentoController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  DepartamentoController.delete
);

module.exports = router;
