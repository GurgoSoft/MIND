const express = require('express');
const router = express.Router();
const Joi = require('joi');

const UsuarioController = require('../controllers/usuarioController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const updateUsuarioSchema = Joi.object({
  idTipoUsuario: commonSchemas.objectId,
  email: Joi.string().email(),
  telefono: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  activo: Joi.boolean(),
  idEstado: commonSchemas.objectId
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  activo: Joi.boolean(),
  bloqueado: Joi.boolean(),
  idTipoUsuario: commonSchemas.objectId
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  UsuarioController.getAll
);

router.get('/stats', 
  AuthMiddleware.authenticate,
  UsuarioController.getStats
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioController.getById
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateUsuarioSchema),
  AuthMiddleware.authenticate,
  UsuarioController.update
);

router.patch('/:id/toggle-active', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioController.toggleActive
);

router.patch('/:id/unblock', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioController.unblock
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  UsuarioController.delete
);

module.exports = router;
