const express = require('express');
const router = express.Router();
const Joi = require('joi');

const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validate, commonSchemas } = require('../../../shared/middleware/validation');

// Validation schemas
const registerSchema = Joi.object({
  persona: Joi.object({
    nombres: Joi.string().required().trim().max(100),
    apellidos: Joi.string().required().trim().max(100),
    tipoDoc: Joi.string().valid('CC', 'TI', 'CE', 'PP', 'RC').default('CC'),
    numDoc: Joi.string().required().trim().max(20),
    fechaNacimiento: Joi.date().required(),
    idPais: commonSchemas.objectId,
    idDepartamento: commonSchemas.objectId,
    idCiudad: commonSchemas.objectId
  }).required(),
  usuario: Joi.object({
    idTipoUsuario: commonSchemas.objectId,
    email: commonSchemas.email,
    telefono: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    passwordHash: commonSchemas.password
  }).required()
});

const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  persona: Joi.object({
    nombres: Joi.string().trim().max(100),
    apellidos: Joi.string().trim().max(100),
    tipoDoc: Joi.string().valid('CC', 'TI', 'CE', 'PP', 'RC'),
    numDoc: Joi.string().trim().max(20),
    fechaNacimiento: Joi.date(),
    idPais: commonSchemas.objectId,
    idDepartamento: commonSchemas.objectId,
    idCiudad: commonSchemas.objectId
  }),
  usuario: Joi.object({
    idTipoUsuario: commonSchemas.objectId,
    email: Joi.string().email(),
    telefono: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: commonSchemas.password
});

// Routes
router.post('/register', 
  validate(registerSchema),
  AuthController.register
);

router.post('/login', 
  validate(loginSchema),
  AuthController.login
);

router.get('/profile', 
  AuthMiddleware.authenticate,
  AuthController.getProfile
);

router.put('/profile', 
  validate(updateProfileSchema),
  AuthMiddleware.authenticate,
  AuthController.updateProfile
);

router.put('/change-password', 
  validate(changePasswordSchema),
  AuthMiddleware.authenticate,
  AuthController.changePassword
);

router.post('/logout', 
  AuthMiddleware.authenticate,
  AuthController.logout
);

module.exports = router;
