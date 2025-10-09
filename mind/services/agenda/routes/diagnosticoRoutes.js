const express = require('express');
const router = express.Router();
const Joi = require('joi');

const CitaDiagnosticoController = require('../controllers/diagnosticoController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const tipoDiagnosticoSchema = Joi.object({
  codigo: Joi.string().required().trim().max(20),
  nombre: Joi.string().required().trim().max(100)
});

const updateTipoDiagnosticoSchema = Joi.object({
  codigo: Joi.string().trim().max(20),
  nombre: Joi.string().trim().max(100)
});

const citaDiagnosticoSchema = Joi.object({
  idTipoDiagnostico: commonSchemas.objectId,
  descripcion: Joi.string().required().trim().max(1000)
});

const updateCitaDiagnosticoSchema = Joi.object({
  idTipoDiagnostico: commonSchemas.objectId,
  descripcion: Joi.string().trim().max(1000)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Routes for Tipos de Diagnostico
router.get('/tipos', 
  AuthMiddleware.authenticate, 
  CitaDiagnosticoController.getAllTipos
);

router.get('/tipos/:id', 
  AuthMiddleware.authenticate, 
  validate(commonSchemas.mongoId, 'params'), 
  CitaDiagnosticoController.getTipoById
);

router.post('/tipos', 
  AuthMiddleware.authenticate, 
  validate(tipoDiagnosticoSchema), 
  CitaDiagnosticoController.createTipo
);

router.put('/tipos/:id', 
  AuthMiddleware.authenticate, 
  validate(commonSchemas.mongoId, 'params'), 
  validate(updateTipoDiagnosticoSchema), 
  CitaDiagnosticoController.updateTipo
);

router.delete('/tipos/:id', 
  AuthMiddleware.authenticate, 
  validate(commonSchemas.mongoId, 'params'), 
  CitaDiagnosticoController.deleteTipo
);

// Routes for Cita Diagnosticos
router.get('/', 
  AuthMiddleware.authenticate, 
  CitaDiagnosticoController.getAll
);

router.get('/:id', 
  AuthMiddleware.authenticate, 
  validate(commonSchemas.mongoId, 'params'), 
  CitaDiagnosticoController.getById
);

router.get('/cita/:citaId', 
  AuthMiddleware.authenticate, 
  validate(commonSchemas.mongoId, 'params'), 
  CitaDiagnosticoController.getByCita
);

router.post('/', 
  AuthMiddleware.authenticate, 
  validate(citaDiagnosticoSchema), 
  CitaDiagnosticoController.create
);

router.put('/:id', 
  AuthMiddleware.authenticate, 
  validate(commonSchemas.mongoId, 'params'), 
  validate(updateCitaDiagnosticoSchema), 
  CitaDiagnosticoController.update
);

router.delete('/:id', 
  AuthMiddleware.authenticate, 
  validate(commonSchemas.mongoId, 'params'), 
  CitaDiagnosticoController.delete
);

module.exports = router;
