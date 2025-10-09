const express = require('express');
const router = express.Router();
const Joi = require('joi');

const MenuController = require('../controllers/menuController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const menuSchema = Joi.object({
  nombre: Joi.string().required().trim().max(100),
  ruta: Joi.string().trim().max(200),
  icono: Joi.string().trim().max(50),
  orden: Joi.number().integer().default(0),
  menuSuperior: commonSchemas.objectId.allow(null),
  activo: Joi.boolean().default(true),
  nivel: Joi.number().integer().default(1)
});

const updateMenuSchema = Joi.object({
  nombre: Joi.string().trim().max(100),
  ruta: Joi.string().trim().max(200),
  icono: Joi.string().trim().max(50),
  orden: Joi.number().integer(),
  menuSuperior: commonSchemas.objectId.allow(null),
  activo: Joi.boolean(),
  nivel: Joi.number().integer()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  activo: Joi.boolean()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  MenuController.getAll
);

router.get('/tree', 
  AuthMiddleware.authenticate,
  MenuController.getMenuTree
);

router.get('/root', 
  AuthMiddleware.authenticate,
  MenuController.getRootMenus
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  MenuController.getById
);

router.get('/:parentId/submenus', 
  validate(Joi.object({ parentId: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  MenuController.getSubmenus
);

router.post('/', 
  validate(menuSchema),
  AuthMiddleware.authenticate,
  MenuController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateMenuSchema),
  AuthMiddleware.authenticate,
  MenuController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  MenuController.delete
);

module.exports = router;
