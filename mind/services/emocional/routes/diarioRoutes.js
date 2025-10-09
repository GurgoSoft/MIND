const express = require('express');
const router = express.Router();
const Joi = require('joi');

const DiarioController = require('../controllers/diarioController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const diarioSchema = Joi.object({
  diario: Joi.object({
    idUsuario: commonSchemas.objectId,
    fecha: Joi.date().default(Date.now),
    titulo: Joi.string().required().trim().max(200),
    nota: Joi.string().required().trim().max(2000),
    calificacion: Joi.number().integer().min(1).max(10).required()
  }).required(),
  emociones: Joi.array().items(
    Joi.object({
      idEmocion: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  ).default([]),
  sensaciones: Joi.array().items(
    Joi.object({
      idSensacion: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  ).default([]),
  sintomas: Joi.array().items(
    Joi.object({
      idSintoma: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  ).default([]),
  sentimientos: Joi.array().items(
    Joi.object({
      idSentimiento: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  ).default([])
});

const updateDiarioSchema = Joi.object({
  diario: Joi.object({
    fecha: Joi.date(),
    titulo: Joi.string().trim().max(200),
    nota: Joi.string().trim().max(2000),
    calificacion: Joi.number().integer().min(1).max(10)
  }),
  emociones: Joi.array().items(
    Joi.object({
      idEmocion: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  ),
  sensaciones: Joi.array().items(
    Joi.object({
      idSensacion: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  ),
  sintomas: Joi.array().items(
    Joi.object({
      idSintoma: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  ),
  sentimientos: Joi.array().items(
    Joi.object({
      idSentimiento: commonSchemas.objectId,
      intensidad: Joi.number().integer().min(1).max(10).required()
    })
  )
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  idUsuario: commonSchemas.objectId,
  fechaInicio: Joi.date(),
  fechaFin: Joi.date()
});

const statsQuerySchema = Joi.object({
  fechaInicio: Joi.date(),
  fechaFin: Joi.date()
});

// Routes
router.get('/', 
  validate(querySchema, 'query'),
  AuthMiddleware.authenticate,
  DiarioController.getAll
);

router.get('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  DiarioController.getById
);

router.get('/user/:idUsuario/stats', 
  validate(Joi.object({ idUsuario: commonSchemas.objectId }), 'params'),
  validate(statsQuerySchema, 'query'),
  AuthMiddleware.authenticate,
  DiarioController.getUserStats
);

router.post('/', 
  validate(diarioSchema),
  AuthMiddleware.authenticate,
  DiarioController.create
);

router.put('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  validate(updateDiarioSchema),
  AuthMiddleware.authenticate,
  DiarioController.update
);

router.delete('/:id', 
  validate(Joi.object({ id: commonSchemas.objectId }), 'params'),
  AuthMiddleware.authenticate,
  DiarioController.delete
);

module.exports = router;
