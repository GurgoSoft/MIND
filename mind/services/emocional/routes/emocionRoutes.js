const express = require('express');
const router = express.Router();
const Joi = require('joi');

const EmocionController = require('../controllers/emocionController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const emocionSchema = Joi.object({
  idTipoEmocion: commonSchemas.objectId,
  idEmocion: Joi.number().integer().required(),
  nombre: Joi.string().required().trim().max(100)
});

const updateEmocionSchema = Joi.object({
  idTipoEmocion: commonSchemas.objectId,
  idEmocion: Joi.number().integer(),
  nombre: Joi.string().trim().max(100)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  idTipoEmocion: commonSchemas.objectId
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  EmocionController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  EmocionController.getById
);

router.get('/tipo/:idTipoEmocion', 
  validate(Joi.object({ idTipoEmocion: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  EmocionController.getByType
);

router.post('/', 
  validate(emocionSchema),
  AuthMiddleware.authenticate,
  EmocionController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateEmocionSchema),
  AuthMiddleware.authenticate,
  EmocionController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  EmocionController.delete
);

module.exports = router;
