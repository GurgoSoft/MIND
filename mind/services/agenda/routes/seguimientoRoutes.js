const express = require('express');
const router = express.Router();
const Joi = require('joi');

const SeguimientoPacienteController = require('../controllers/seguimientoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const seguimientoSchema = Joi.object({
  idCita: commonSchemas.objectId,
  idUsuarioPaciente: commonSchemas.objectId,
  instrucciones: Joi.string().required().trim().max(2000),
  fechaProximaRevision: Joi.date().required()
});

const updateSeguimientoSchema = Joi.object({
  instrucciones: Joi.string().trim().max(2000),
  fechaProximaRevision: Joi.date()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  idCita: commonSchemas.objectId,
  idUsuarioPaciente: commonSchemas.objectId
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.getAll
);

router.get('/pending', 
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.getPendingFollowUps
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.getById
);

router.get('/patient/:idUsuarioPaciente', 
  validate(Joi.object({ idUsuarioPaciente: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.getByPatient
);

router.get('/cita/:idCita', 
  validate(Joi.object({ idCita: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.getByCita
);

router.post('/', 
  validate(seguimientoSchema),
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateSeguimientoSchema),
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  SeguimientoPacienteController.delete
);

module.exports = router;
