const express = require('express');
const router = express.Router();
const Joi = require('joi');

const AccesoController = require('../controllers/accesoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const accesoSchema = Joi.object({
  codigo: Joi.string().required().trim().max(20),
  nombre: Joi.string().required().trim().max(100),
  scope: Joi.string().valid('READ', 'WRITE', 'DELETE', 'ADMIN').default('READ')
});

const updateAccesoSchema = Joi.object({
  codigo: Joi.string().trim().max(20),
  nombre: Joi.string().trim().max(100),
  scope: Joi.string().valid('READ', 'WRITE', 'DELETE', 'ADMIN')
});

const assignRevokeSchema = Joi.object({
  idUsuario: commonSchemas.objectId,
  idAcceso: commonSchemas.objectId
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  AccesoController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  AccesoController.getById
);

router.post('/', 
  validate(accesoSchema),
  AuthMiddleware.authenticate,
  AccesoController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateAccesoSchema),
  AuthMiddleware.authenticate,
  AccesoController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  AccesoController.delete
);

// User access management
router.post('/assign', 
  validate(assignRevokeSchema),
  AuthMiddleware.authenticate,
  AccesoController.assignToUser
);

router.post('/revoke', 
  validate(assignRevokeSchema),
  AuthMiddleware.authenticate,
  AccesoController.revokeFromUser
);

router.get('/user/:idUsuario', 
  validate(Joi.object({ idUsuario: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  AccesoController.getUserAccesses
);

module.exports = router;
