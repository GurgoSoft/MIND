const express = require('express');
const router = express.Router();
const Joi = require('joi');

const SentimientoController = require('../controllers/sentimientoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const sentimientoSchema = Joi.object({
  idSentimiento: Joi.number().integer().required(),
  nombre: Joi.string().required().trim().max(100),
  tipo: Joi.string().required().trim().max(50)
});

const updateSentimientoSchema = Joi.object({
  idSentimiento: Joi.number().integer(),
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
  SentimientoController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SentimientoController.getById
);

router.get('/tipo/:tipo', 
  validate(Joi.object({ tipo: Joi.string().required() }), 'params'),
  AuthMiddleware.authenticate,
  SentimientoController.getByType
);

router.post('/', 
  validate(sentimientoSchema),
  AuthMiddleware.authenticate,
  SentimientoController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateSentimientoSchema),
  AuthMiddleware.authenticate,
  SentimientoController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SentimientoController.delete
);

module.exports = router;
