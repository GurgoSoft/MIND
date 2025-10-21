const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../../../shared/models/usuarios/Usuario');
const Persona = require('../../../shared/models/usuarios/Persona');
const TipoUsuario = require('../../../shared/models/usuarios/TipoUsuario');
const Estado = require('../../../shared/models/administrativo/Estado');
const UsuarioAuditoria = require('../../../shared/models/usuarios/UsuarioAuditoria');
const AuthMiddleware = require('../../../shared/middleware/auth');
const emailService = require('../services/emailService');

class AuthController {
  // Register new user
  static async register(req, res) {
    let nuevaPersona = null;
    
    try {
      const { persona, usuario } = req.body;

      // Validate required fields
      if (!persona || !usuario) {
        return res.status(400).json({
          success: false,
          message: 'Datos de persona y usuario son requeridos'
        });
      }

      // Check if email already exists
      const existingUser = await Usuario.findOne({ email: usuario.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Check if document already exists
      const existingPersona = await Persona.findOne({ 
        tipoDoc: persona.tipoDoc, 
        numDoc: persona.numDoc 
      });
      if (existingPersona) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una persona con este documento'
        });
      }

      // Create persona first
      nuevaPersona = new Persona(persona);
      await nuevaPersona.save();

      // Ensure idTipoUsuario exists (assign default if not provided)
      let idTipoUsuario = usuario.idTipoUsuario;
      if (!idTipoUsuario) {
        const defaultCodigo = (process.env.DEFAULT_TIPO_USUARIO_CODIGO || 'PACIENTE').toUpperCase();
        const defaultNombre = process.env.DEFAULT_TIPO_USUARIO_NOMBRE || 'Paciente';

        let tipo = await TipoUsuario.findOne({ codigo: defaultCodigo });
        if (!tipo) {
          try {
            tipo = await TipoUsuario.create({ codigo: defaultCodigo, nombre: defaultNombre });
          } catch (e) {
            // Handle race condition if another request created it concurrently
            if (e && e.code === 11000) {
              tipo = await TipoUsuario.findOne({ codigo: defaultCodigo });
            } else {
              throw e;
            }
          }
        }
        if (!tipo) {
          return res.status(400).json({
            success: false,
            message: 'No se pudo determinar el tipo de usuario por defecto'
          });
        }
        idTipoUsuario = tipo._id;
      }

      // Default Estado (Pendiente de Verificación - 0004)
      let estadoDoc = await Estado.findOne({ codigo: '0004' });
      if (!estadoDoc) {
        try {
          estadoDoc = await Estado.create({ codigo: '0004', nombre: 'Pendiente de Verificación', color: '#E8871E' });
        } catch (e) {
          if (e && e.code === 11000) {
            estadoDoc = await Estado.findOne({ codigo: '0004' });
          } else {
            throw e;
          }
        }
      }

      // Create usuario with reference to persona, tipo y estado
      const nuevoUsuario = new Usuario({
        ...usuario,
        idPersona: nuevaPersona._id,
        idTipoUsuario,
        idEstado: estadoDoc?._id || null
      });

      await nuevoUsuario.save();

      // Generate JWT token
      const token = AuthMiddleware.generateToken({
        userId: nuevoUsuario._id,
        email: nuevoUsuario.email
      });

      // Populate user data
      await nuevoUsuario.populate([
        { path: 'idPersona' },
        { path: 'idTipoUsuario', select: 'codigo nombre' }
      ]);

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: nuevoUsuario._id,
          accion: 'CREATE',
          usuarioId: nuevoUsuario._id,
          datosNuevos: {
            email: nuevoUsuario.email,
            persona: nuevaPersona.toObject()
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          usuario: {
            _id: nuevoUsuario._id,
            email: nuevoUsuario.email,
            telefono: nuevoUsuario.telefono,
            activo: nuevoUsuario.activo,
            persona: nuevoUsuario.idPersona,
            tipoUsuario: nuevoUsuario.idTipoUsuario
          },
          token
        }
      });
    } catch (error) {
      // If user creation fails, clean up persona if it was created
      if (nuevaPersona && nuevaPersona._id) {
        try {
          await Persona.findByIdAndDelete(nuevaPersona._id);
          console.log('Persona cleanup completed after user creation failure');
        } catch (cleanupError) {
          console.error('Error cleaning up persona:', cleanupError);
        }
      }

      // Log the error for debugging
      console.error('Registration error:', error);

      // Friendly error messages
      let message = 'Error registrando usuario';
      if (error && (error.code === 11000 || error.code === '11000')) {
        // Duplicate key error
        const msg = error.message || '';
        if (/email/i.test(msg)) {
          message = 'El email ya está registrado';
        } else if (/numDoc/i.test(msg)) {
          message = 'Ya existe una persona con este documento';
        } else {
          message = 'Registro duplicado';
        }
      } else if (error && error.name === 'ValidationError') {
        // Mongoose validation error
        const firstKey = Object.keys(error.errors || {})[0];
        const firstErr = firstKey ? error.errors[firstKey] : null;
        message = firstErr?.message || message;
      } else if (typeof error?.message === 'string' && error.message.trim()) {
        // Bubble specific message when meaningful
        message = error.message;
      }

      res.status(400).json({
        success: false,
        message,
        error: error?.message
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const usuario = await Usuario.findOne({ email })
        .populate([
          { path: 'idPersona' },
          { path: 'idTipoUsuario', select: 'codigo nombre' }
        ]);

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Check if user is active
      if (!usuario.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo'
        });
      }

      // Check if user is blocked
      if (usuario.bloqueado) {
        return res.status(401).json({
          success: false,
          message: 'Usuario bloqueado por múltiples intentos fallidos'
        });
      }

      // Verify password
      const isValidPassword = await usuario.comparePassword(password);

      if (!isValidPassword) {
        // Increment failed attempts
        await usuario.incrementFailedAttempts();
        
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Update last access and reset failed attempts
      await usuario.updateLastAccess();

      // Generate JWT token
      const token = AuthMiddleware.generateToken({
        userId: usuario._id,
        email: usuario.email
      });

      // Audit log
      await UsuarioAuditoria.create({
        entidad: 'Usuario',
        idEntidad: usuario._id,
        accion: 'LOGIN',
        usuarioId: usuario._id,
        datosNuevos: { loginTime: new Date() },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          usuario: {
            _id: usuario._id,
            email: usuario.email,
            telefono: usuario.telefono,
            activo: usuario.activo,
            persona: usuario.idPersona,
            tipoUsuario: usuario.idTipoUsuario,
            fechaUltimoAcceso: usuario.fechaUltimoAcceso
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en el login',
        error: error.message
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const usuario = await Usuario.findById(req.userId)
        .populate([
          { path: 'idPersona' },
          { path: 'idTipoUsuario', select: 'codigo nombre' }
        ])
        .select('-passwordHash');

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo perfil',
        error: error.message
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { persona, usuario } = req.body;
      
      const usuarioActual = await Usuario.findById(req.userId);
      if (!usuarioActual) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Update persona if provided
      if (persona) {
        const personaAnterior = await Persona.findById(usuarioActual.idPersona);
        await Persona.findByIdAndUpdate(
          usuarioActual.idPersona,
          persona,
          { new: true, runValidators: true }
        );
      }

      // Update usuario if provided
      let usuarioActualizado = usuarioActual;
      if (usuario) {
        const usuarioAnterior = { ...usuarioActual.toObject() };
        usuarioActualizado = await Usuario.findByIdAndUpdate(
          req.userId,
          usuario,
          { new: true, runValidators: true }
        );

        // Audit log for usuario update (non-critical)
        try {
          await UsuarioAuditoria.create({
            entidad: 'Usuario',
            idEntidad: usuarioActualizado._id,
            accion: 'UPDATE',
            usuarioId: req.userId,
            datosAnteriores: usuarioAnterior,
            datosNuevos: usuarioActualizado.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (auditError) {
          console.error('Error en audit log:', auditError.message);
        }
      }

      // Get updated user with populated fields
      const usuarioCompleto = await Usuario.findById(req.userId)
        .populate([
          { path: 'idPersona' },
          { path: 'idTipoUsuario', select: 'codigo nombre' }
        ])
        .select('-passwordHash');

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: usuarioCompleto
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando perfil',
        error: error.message
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const usuario = await Usuario.findById(req.userId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verify current password
      const isValidPassword = await usuario.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Update password (will be hashed automatically by model pre-save hook)
      usuario.passwordHash = newPassword;
      await usuario.save();

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: usuario._id,
          accion: 'UPDATE',
          usuarioId: req.userId,
          datosNuevos: { passwordChanged: true },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error cambiando contraseña',
        error: error.message
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: req.userId,
          accion: 'LOGOUT',
          usuarioId: req.userId,
          datosNuevos: { logoutTime: new Date() },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en logout',
        error: error.message
      });
    }
  }

  // Send verification email
  static async sendVerificationEmail(req, res) {
    try {
      const { usuarioId } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del usuario es requerido'
        });
      }

      // Find user (incluir campos de verificación)
      const usuario = await Usuario.findById(usuarioId)
        .select('+verificationCode +verificationCodeExpires') // Incluir campos ocultos
        .populate('idPersona');

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save verification code to user document
      usuario.verificationCode = verificationCode;
      usuario.verificationCodeExpires = expiresAt;
      await usuario.save();

      // Send verification email
      try {
        const userName = usuario.idPersona?.nombres || '';
        await emailService.sendVerificationCode(usuario.email, verificationCode, userName);
      } catch (emailError) {
        console.error('Error enviando correo:', emailError.message);
      }

      // Audit log
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: usuarioId,
          accion: 'VERIFICATION_CODE_SENT',
          usuarioId: usuarioId,
          datosNuevos: { 
            email: usuario.email,
            codeGenerated: true,
            expiresAt: expiresAt,
            timestamp: new Date()
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Código de verificación enviado exitosamente',
        data: {
          usuarioId: usuario._id,
          email: usuario.email,
          expiresAt: expiresAt,
          // Solo para desarrollo - remover en producción
          verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error enviando código de verificación',
        error: error.message
      });
    }
  }

  // Verify registration code
  static async verifyCode(req, res) {
    try {
      const { usuarioId, code } = req.body;

      if (!usuarioId || !code) {
        return res.status(400).json({
          success: false,
          message: 'Usuario ID y código son requeridos'
        });
      }

      // Find user (incluir campos de verificación)
      const usuario = await Usuario.findById(usuarioId)
        .select('+verificationCode +verificationCodeExpires')
        .populate([
          { path: 'idPersona' },
          { path: 'idTipoUsuario', select: 'codigo nombre' }
        ]);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Check if code exists and hasn't expired
      if (!usuario.verificationCode || !usuario.verificationCodeExpires) {
        return res.status(400).json({
          success: false,
          message: 'No hay código de verificación pendiente'
        });
      }

      if (new Date() > usuario.verificationCodeExpires) {
        return res.status(400).json({
          success: false,
          message: 'El código de verificación ha expirado'
        });
      }

      if (usuario.verificationCode !== code) {
        return res.status(400).json({
          success: false,
          message: 'Código de verificación incorrecto'
        });
      }

      // Mark user as verified and clear verification code
      usuario.emailVerified = true;
      usuario.verificationCode = undefined;
      usuario.verificationCodeExpires = undefined;
      usuario.activo = true; // Activate the user
      
      // Update state to "Activo" (0003) when verified
      const Estado = require('../../../shared/models/administrativo/Estado');
      const estadoActivo = await Estado.findOne({ codigo: '0003' });
      if (estadoActivo) {
        usuario.idEstado = estadoActivo._id;
      }
      
      await usuario.save();

      // Generate new JWT token for auto-login
      const token = AuthMiddleware.generateToken({
        userId: usuario._id,
        email: usuario.email
      });

      // Audit log
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: usuarioId,
          accion: 'EMAIL_VERIFIED',
          usuarioId: usuarioId,
          datosNuevos: { 
            emailVerified: true,
            activatedAt: new Date(),
            autoLogin: true
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Verificación exitosa - Usuario activado',
        data: {
          usuario: {
            _id: usuario._id,
            email: usuario.email,
            telefono: usuario.telefono,
            activo: usuario.activo,
            emailVerified: usuario.emailVerified,
            persona: usuario.idPersona,
            tipoUsuario: usuario.idTipoUsuario
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error verificando código',
        error: error.message
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const usuario = await Usuario.findById(req.user.id)
        .populate([
          { path: 'idPersona', select: 'nombres apellidos numDoc tipoDoc fechaNac' },
          { path: 'idTipoUsuario', select: 'codigo nombre' }
        ]);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          id: usuario._id,
          email: usuario.email,
          telefono: usuario.telefono,
          activo: usuario.activo,
          emailVerified: usuario.emailVerified,
          persona: usuario.idPersona,
          tipoUsuario: usuario.idTipoUsuario,
          fechaUltimoAcceso: usuario.fechaUltimoAcceso
        }
      });

    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = AuthController;
