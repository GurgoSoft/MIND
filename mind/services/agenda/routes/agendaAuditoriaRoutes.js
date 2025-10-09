const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const AgendaAuditoriaController = require('../controllers/agendaAuditoriaController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { handleValidationErrors } = require('../../../shared/middleware/validation');

// Validation schemas
const idValidation = [
  param('id').isMongoId().withMessage('ID inválido')
];

const entidadValidation = [
  param('entidad').notEmpty().withMessage('Entidad es requerida'),
  param('idEntidad').isMongoId().withMessage('ID de entidad inválido')
];

const usuarioIdValidation = [
  param('usuarioId').isMongoId().withMessage('ID de usuario inválido')
];

const cleanupValidation = [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Días debe ser un número entre 1 y 365')
];

// Routes
router.get('/', AuthMiddleware.authenticate, AgendaAuditoriaController.getAll);
router.get('/stats', AuthMiddleware.authenticate, AgendaAuditoriaController.getStats);
router.get('/entidad/:entidad/:idEntidad', AuthMiddleware.authenticate, entidadValidation, handleValidationErrors, AgendaAuditoriaController.getByEntidad);
router.get('/usuario/:usuarioId', AuthMiddleware.authenticate, usuarioIdValidation, handleValidationErrors, AgendaAuditoriaController.getByUsuario);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, AgendaAuditoriaController.getById);
router.delete('/cleanup', AuthMiddleware.authenticate, cleanupValidation, handleValidationErrors, AgendaAuditoriaController.cleanup);

module.exports = router;
