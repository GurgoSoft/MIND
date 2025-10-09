const express = require('express');
const router = express.Router();
const Joi = require('joi');

const PersonaController = require('../controllers/personaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const personaSchema = Joi.object({
  nombres: Joi.string().required().trim().max(100),
  apellidos: Joi.string().required().trim().max(100),
  tipoDoc: Joi.string().valid('CC', 'TI', 'CE', 'PP', 'RC').default('CC'),
  numDoc: Joi.string().required().trim().max(20),
  fechaNacimiento: Joi.date().required(),
  idPais: commonSchemas.objectId,
  idDepartamento: commonSchemas.objectId,
  idCiudad: commonSchemas.objectId
});

const updatePersonaSchema = Joi.object({
  nombres: Joi.string().trim().max(100),
  apellidos: Joi.string().trim().max(100),
  tipoDoc: Joi.string().valid('CC', 'TI', 'CE', 'PP', 'RC'),
  numDoc: Joi.string().trim().max(20),
  fechaNacimiento: Joi.date(),
  idPais: commonSchemas.objectId,
  idDepartamento: commonSchemas.objectId,
  idCiudad: commonSchemas.objectId
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  tipoDoc: Joi.string().valid('CC', 'TI', 'CE', 'PP', 'RC'),
  idPais: commonSchemas.objectId,
  idDepartamento: commonSchemas.objectId,
  idCiudad: commonSchemas.objectId
});

const searchDocumentSchema = Joi.object({
  tipoDoc: Joi.string().valid('CC', 'TI', 'CE', 'PP', 'RC').required(),
  numDoc: Joi.string().required().trim()
});

const searchNameSchema = Joi.object({
  query: Joi.string().required().min(2).max(100)
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  PersonaController.getAll
);

router.get('/search/document', 
  validate(searchDocumentSchema, 'query'),
  AuthMiddleware.authenticate,
  PersonaController.searchByDocument
);

router.get('/search/name', 
  validate(searchNameSchema, 'query'),
  AuthMiddleware.authenticate,
  PersonaController.searchByName
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  PersonaController.getById
);

router.post('/', 
  validate(personaSchema),
  AuthMiddleware.authenticate,
  PersonaController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updatePersonaSchema),
  AuthMiddleware.authenticate,
  PersonaController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  PersonaController.delete
);

module.exports = router;
