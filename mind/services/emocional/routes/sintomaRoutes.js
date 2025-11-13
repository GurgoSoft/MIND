const express = require('express');
const router = express.Router();
const Joi = require('joi');

const SintomaController = require('../controllers/sintomaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const sintomaSchema = Joi.object({
  idSintoma: Joi.string().required().trim(),
  nombre: Joi.string().required().trim().max(100),
  tipo: Joi.string().optional().trim().max(50),
  descripcion: Joi.string().optional().trim().max(500)
});

const updateSintomaSchema = Joi.object({
  idSintoma: Joi.string().trim(),
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
  SintomaController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  SintomaController.getById
);

router.get('/tipo/:tipo', 
  validate(Joi.object({ tipo: Joi.string().required() }), 'params'),
  SintomaController.getByType
);

router.post('/', 
  validate(sintomaSchema),
  SintomaController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateSintomaSchema),
  AuthMiddleware.authenticate,
  SintomaController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SintomaController.delete
);

module.exports = router;
