const express = require('express');
const router = express.Router();
const Joi = require('joi');

const SentimientoController = require('../controllers/sentimientoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const sentimientoSchema = Joi.object({
  idSentimiento: Joi.string().required().trim(),
  nombre: Joi.string().required().trim().max(100),
  tipo: Joi.string().optional().trim().max(50),
  descripcion: Joi.string().optional().trim().max(500)
});

const updateSentimientoSchema = Joi.object({
  idSentimiento: Joi.string().trim(),
  nombre: Joi.string().trim().max(100),
  tipo: Joi.string().trim().max(50),
  descripcion: Joi.string().trim().max(500)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  tipo: Joi.string().trim()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  SentimientoController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  SentimientoController.getById
);

router.get('/tipo/:tipo', 
  validate(Joi.object({ tipo: Joi.string().required() }), 'params'),
  SentimientoController.getByType
);

router.post('/', 
  validate(sentimientoSchema),
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
