const express = require('express');
const router = express.Router();
const { param, query, body } = require('express-validator');
const AdministracionAuditoriaController = require('../controllers/administracionAuditoriaController');
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
router.get('/', AuthMiddleware.authenticate, AdministracionAuditoriaController.getAll);
router.get('/stats', AuthMiddleware.authenticate, AdministracionAuditoriaController.getStats);
router.get('/entidad/:entidad/:idEntidad', AuthMiddleware.authenticate, entidadValidation, handleValidationErrors, AdministracionAuditoriaController.getByEntidad);
router.get('/usuario/:usuarioId', AuthMiddleware.authenticate, usuarioIdValidation, handleValidationErrors, AdministracionAuditoriaController.getByUsuario);
router.get('/:id', AuthMiddleware.authenticate, idValidation, handleValidationErrors, AdministracionAuditoriaController.getById);
router.delete('/cleanup', AuthMiddleware.authenticate, cleanupValidation, handleValidationErrors, AdministracionAuditoriaController.cleanup);

// Registrar un evento de login/logout o genérico desde otros servicios/clients
router.post('/track',
  AuthMiddleware.authenticate,
  body('entidad').notEmpty().withMessage('Entidad es requerida'),
  body('idEntidad').isMongoId().withMessage('ID de entidad inválido'),
  body('accion').isIn(['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE']).withMessage('Acción inválida'),
  handleValidationErrors,
  AdministracionAuditoriaController.track
);

module.exports = router;
