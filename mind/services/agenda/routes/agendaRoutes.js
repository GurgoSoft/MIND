const express = require('express');
const router = express.Router();
const Joi = require('joi');

const AgendaController = require('../controllers/agendaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const agendaSchema = Joi.object({
  idUsuario: commonSchemas.objectId,
  idTipoAgenda: commonSchemas.objectId,
  nombre: Joi.string().required().trim().max(200),
  descripcion: Joi.string().trim().max(500)
});

const updateAgendaSchema = Joi.object({
  idTipoAgenda: commonSchemas.objectId,
  nombre: Joi.string().trim().max(200),
  descripcion: Joi.string().trim().max(500)
});

const agendaDiaSchema = Joi.object({
  fecha: Joi.date().required()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  idUsuario: commonSchemas.objectId,
  idTipoAgenda: commonSchemas.objectId
});

const agendaDaysQuerySchema = Joi.object({
  fechaInicio: Joi.date(),
  fechaFin: Joi.date()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  AgendaController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  AgendaController.getById
);

router.get('/user/:idUsuario', 
  validate(Joi.object({ idUsuario: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  AgendaController.getUserAgendas
);

router.get('/tipo/:idTipoAgenda', 
  validate(Joi.object({ idTipoAgenda: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  AgendaController.getByType
);

router.get('/:idAgenda/dias', 
  validate(Joi.object({ idAgenda: commonSchemas.objectId }), 'params'),
  validate(agendaDaysQuerySchema, 'query'),
  AuthMiddleware.authenticate,
  AgendaController.getAgendaDays
);

router.post('/', 
  validate(agendaSchema),
  AuthMiddleware.authenticate,
  AgendaController.create
);

router.post('/:idAgenda/dias', 
  validate(Joi.object({ idAgenda: commonSchemas.objectId }), 'params'),
  validate(agendaDiaSchema),
  AuthMiddleware.authenticate,
  AgendaController.createAgendaDay
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateAgendaSchema),
  AuthMiddleware.authenticate,
  AgendaController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  AgendaController.delete
);

module.exports = router;
