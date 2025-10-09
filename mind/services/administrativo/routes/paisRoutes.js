const express = require('express');
const router = express.Router();
const Joi = require('joi');

const PaisController = require('../controllers/paisController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const paisSchema = Joi.object({
  nombre: Joi.string().required().trim().max(100),
  codigoISO: Joi.string().required().trim().length(2).uppercase()
});

const updatePaisSchema = Joi.object({
  nombre: Joi.string().trim().max(100),
  codigoISO: Joi.string().trim().length(2).uppercase()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  PaisController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  PaisController.getById
);

router.post('/', 
  validate(paisSchema),
  AuthMiddleware.authenticate,
  PaisController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updatePaisSchema),
  AuthMiddleware.authenticate,
  PaisController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  PaisController.delete
);

module.exports = router;
