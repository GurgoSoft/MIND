const express = require('express');
const router = express.Router();
const Joi = require('joi');

const CitaController = require('../controllers/citaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const citaSchema = Joi.object({
  idAgenda: commonSchemas.objectId,
  idUsuarioEspecialista: commonSchemas.objectId,
  idUsuarioPaciente: commonSchemas.objectId,
  fechaHoraInicio: Joi.date().required(),
  fechaHoraFin: Joi.date().required(),
  estado: Joi.string().valid('programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio').default('programada'),
  modalidad: Joi.string().valid('presencial', 'virtual', 'telefonica').default('presencial'),
  ubicacion: Joi.string().trim().max(200),
  notas: Joi.string().trim().max(1000)
});

const updateCitaSchema = Joi.object({
  idAgenda: commonSchemas.objectId,
  fechaHoraInicio: Joi.date(),
  fechaHoraFin: Joi.date(),
  estado: Joi.string().valid('programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio'),
  modalidad: Joi.string().valid('presencial', 'virtual', 'telefonica'),
  ubicacion: Joi.string().trim().max(200),
  notas: Joi.string().trim().max(1000)
});

const citaContentSchema = Joi.object({
  notas: Joi.string().required().trim().max(5000)
});

const cancelSchema = Joi.object({
  motivo: Joi.string().trim().max(500)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  idAgenda: commonSchemas.objectId,
  idUsuarioEspecialista: commonSchemas.objectId,
  idUsuarioPaciente: commonSchemas.objectId,
  estado: Joi.string().valid('programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio'),
  fechaInicio: Joi.date(),
  fechaFin: Joi.date()
});

const userAppointmentsQuerySchema = Joi.object({
  rol: Joi.string().valid('paciente', 'especialista').default('paciente')
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  CitaController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  CitaController.getById
);

router.get('/user/:idUsuario', 
  validate(Joi.object({ idUsuario: commonSchemas.objectId }), 'params'),
  validate(userAppointmentsQuerySchema, 'query'),
  AuthMiddleware.authenticate,
  CitaController.getUserAppointments
);

router.post('/', 
  validate(citaSchema),
  AuthMiddleware.authenticate,
  CitaController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateCitaSchema),
  AuthMiddleware.authenticate,
  CitaController.update
);

router.patch('/:id/cancel', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(cancelSchema),
  AuthMiddleware.authenticate,
  CitaController.cancel
);

router.patch('/:id/complete', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  CitaController.complete
);

router.post('/:id/content', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(citaContentSchema),
  AuthMiddleware.authenticate,
  CitaController.addContent
);

module.exports = router;
