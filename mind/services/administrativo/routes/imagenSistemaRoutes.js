const express = require('express');
const router = express.Router();
const Joi = require('joi');

const ImagenSistemaController = require('../controllers/imagenSistemaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const imagenSchema = Joi.object({
  tipo: Joi.string().valid('logo', 'banner', 'avatar', 'background', 'icon', 'other').default('other'),
  url: Joi.string().required().trim().uri(),
  hash: Joi.string().trim(),
  metadata: Joi.object({
    size: Joi.number().integer().min(0),
    width: Joi.number().integer().min(0),
    height: Joi.number().integer().min(0),
    format: Joi.string().trim()
  }),
  activo: Joi.boolean().default(true)
});

const updateImagenSchema = Joi.object({
  tipo: Joi.string().valid('logo', 'banner', 'avatar', 'background', 'icon', 'other'),
  url: Joi.string().trim().uri(),
  hash: Joi.string().trim(),
  metadata: Joi.object({
    size: Joi.number().integer().min(0),
    width: Joi.number().integer().min(0),
    height: Joi.number().integer().min(0),
    format: Joi.string().trim()
  }),
  activo: Joi.boolean()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  tipo: Joi.string().valid('logo', 'banner', 'avatar', 'background', 'icon', 'other'),
  activo: Joi.boolean()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  ImagenSistemaController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  ImagenSistemaController.getById
);

router.post('/', 
  validate(imagenSchema),
  AuthMiddleware.authenticate,
  ImagenSistemaController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateImagenSchema),
  AuthMiddleware.authenticate,
  ImagenSistemaController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  ImagenSistemaController.delete
);

router.get('/type/:tipo', 
  validate(Joi.object({ tipo: Joi.string().valid('logo', 'banner', 'avatar', 'background', 'icon', 'other') }), 'params'),
  AuthMiddleware.authenticate,
  ImagenSistemaController.getByType
);

router.patch('/:id/toggle-active', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  ImagenSistemaController.toggleActive
);

module.exports = router;
