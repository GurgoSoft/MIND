const express = require('express');
const router = express.Router();
const Joi = require('joi');

const NotificacionController = require('../controllers/notificacionController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const notificacionSchema = Joi.object({
  idTipoNotificacion: commonSchemas.objectId,
  titulo: Joi.string().required().trim().max(200),
  mensaje: Joi.string().required().trim().max(1000),
  destinatario: commonSchemas.objectId,
  fechaProgramada: Joi.date().default(Date.now),
  enviado: Joi.boolean().default(false),
  fechaEnvio: Joi.date()
});

const updateNotificacionSchema = Joi.object({
  idTipoNotificacion: commonSchemas.objectId,
  titulo: Joi.string().trim().max(200),
  mensaje: Joi.string().trim().max(1000),
  destinatario: commonSchemas.objectId,
  fechaProgramada: Joi.date(),
  enviado: Joi.boolean(),
  fechaEnvio: Joi.date()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  enviado: Joi.boolean(),
  destinatario: commonSchemas.objectId
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  NotificacionController.getAll
);

router.get('/pending', 
  AuthMiddleware.authenticate,
  NotificacionController.getPending
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  NotificacionController.getById
);

router.get('/user/:idUsuario', 
  validate(Joi.object({ idUsuario: commonSchemas.objectId }), 'params'),
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  NotificacionController.getUserNotifications
);

router.post('/', 
  validate(notificacionSchema),
  AuthMiddleware.authenticate,
  NotificacionController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateNotificacionSchema),
  AuthMiddleware.authenticate,
  NotificacionController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  NotificacionController.delete
);

router.patch('/:id/mark-sent', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  NotificacionController.markAsSent
);

module.exports = router;
