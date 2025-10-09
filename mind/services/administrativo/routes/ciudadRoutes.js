const express = require('express');
const router = express.Router();
const Joi = require('joi');

const CiudadController = require('../controllers/ciudadController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const ciudadSchema = Joi.object({
  idDepartamento: commonSchemas.objectId,
  nombre: Joi.string().required().trim().max(100),
  codigoDANE: Joi.string().required().trim().max(10)
});

const updateCiudadSchema = Joi.object({
  idDepartamento: commonSchemas.objectId,
  nombre: Joi.string().trim().max(100),
  codigoDANE: Joi.string().trim().max(10)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  idDepartamento: commonSchemas.objectId
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  CiudadController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  CiudadController.getById
);

router.post('/', 
  validate(ciudadSchema),
  AuthMiddleware.authenticate,
  CiudadController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateCiudadSchema),
  AuthMiddleware.authenticate,
  CiudadController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  CiudadController.delete
);

module.exports = router;
