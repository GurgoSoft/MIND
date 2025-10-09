const mongoose = require('mongoose');
const UsuarioSuscripcion = require('../../../shared/models/usuarios/UsuarioSuscripcion');
const InformacionPago = require('../../../shared/models/usuarios/InformacionPago');
const UsuarioAuditoria = require('../../../shared/models/usuarios/UsuarioAuditoria');

class SuscripcionUsuarioController {
  // Get all user subscriptions
  static async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.estado) {
        filter.estado = req.query.estado;
      }
      if (req.query.idUsuario) {
        filter.idUsuario = req.query.idUsuario;
      }

      const suscripciones = await UsuarioSuscripcion.find(filter)
        .populate([
          { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idSuscripcion', populate: { path: 'idTipoSuscripcion', select: 'codigo nombre' } }
        ])
        .sort({ fechaInicio: -1 });

      res.json({
        success: true,
        data: suscripciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo suscripciones de usuarios',
        error: error.message
      });
    }
  }

  // Get user subscription by ID
  static async getById(req, res) {
    try {
      const suscripcion = await UsuarioSuscripcion.findById(req.params.id)
        .populate([
          { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idSuscripcion', populate: { path: 'idTipoSuscripcion', select: 'codigo nombre' } }
        ]);
      
      if (!suscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción de usuario no encontrada'
        });
      }

      res.json({
        success: true,
        data: suscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo suscripción de usuario',
        error: error.message
      });
    }
  }

  // Create new user subscription
  static async create(req, res) {
    try {
      // Validate required fields
      const { idUsuario, idSuscripcion, fechaInicio } = req.body;
      
      if (!idUsuario || !idSuscripcion || !fechaInicio) {
        return res.status(400).json({
          success: false,
          message: 'Usuario, suscripción y fecha de inicio son requeridos'
        });
      }

      // Validate references exist
      const Usuario = require('../../../shared/models/usuarios/Usuario');
      const Suscripcion = require('../../../shared/models/administrativo/Suscripcion');

      const usuarioExists = await Usuario.findById(idUsuario);
      if (!usuarioExists) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const suscripcionExists = await Suscripcion.findById(idSuscripcion);
      if (!suscripcionExists) {
        return res.status(400).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      // Check for active subscription
      const activeSuscripcion = await UsuarioSuscripcion.findOne({
        idUsuario,
        activa: true
      });
      
      if (activeSuscripcion) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya tiene una suscripción activa'
        });
      }

      // Create subscription
      const suscripcion = new UsuarioSuscripcion(req.body);
      const savedSuscripcion = await suscripcion.save();
      
      await savedSuscripcion.populate([
        { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
        { path: 'idSuscripcion', populate: { path: 'idTipoSuscripcion', select: 'codigo nombre' } }
      ]);

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'UsuarioSuscripcion',
          idEntidad: savedSuscripcion._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedSuscripcion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Suscripción de usuario creada exitosamente',
        data: savedSuscripcion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando suscripción de usuario',
        error: error.message
      });
    }
  }

  // Update user subscription
  static async update(req, res) {
    try {
      const suscripcionAnterior = await UsuarioSuscripcion.findById(req.params.id);
      
      if (!suscripcionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción de usuario no encontrada'
        });
      }

      const suscripcion = await UsuarioSuscripcion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
        { path: 'idSuscripcion', populate: { path: 'idTipoSuscripcion', select: 'codigo nombre' } }
      ]);

      // Audit log
      try {
        await UsuarioAuditoria.create({
          entidad: 'UsuarioSuscripcion',
          idEntidad: suscripcion._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: suscripcionAnterior.toObject(),
          datosNuevos: suscripcion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Suscripción de usuario actualizada exitosamente',
        data: suscripcion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando suscripción de usuario',
        error: error.message
      });
    }
  }

  // Cancel user subscription
  static async cancel(req, res) {
    try {
      const suscripcion = await UsuarioSuscripcion.findById(req.params.id);
      
      if (!suscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción de usuario no encontrada'
        });
      }

      if (suscripcion.estado === 'cancelada') {
        return res.status(400).json({
          success: false,
          message: 'La suscripción ya está cancelada'
        });
      }

      const suscripcionAnterior = { ...suscripcion.toObject() };
      suscripcion.estado = 'cancelada';
      suscripcion.renovacionAutomatica = false;
      await suscripcion.save();

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
        entidad: 'UsuarioSuscripcion',
        idEntidad: suscripcion._id,
        accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
        datosAnteriores: suscripcionAnterior,
        datosNuevos: suscripcion.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Suscripción cancelada exitosamente',
        data: suscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelando suscripción',
        error: error.message
      });
    }
  }

  // Reactivate user subscription
  static async reactivate(req, res) {
    try {
      const suscripcion = await UsuarioSuscripcion.findById(req.params.id);
      
      if (!suscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción de usuario no encontrada'
        });
      }

      if (suscripcion.estado === 'activa') {
        return res.status(400).json({
          success: false,
          message: 'La suscripción ya está activa'
        });
      }

      const suscripcionAnterior = { ...suscripcion.toObject() };
      suscripcion.estado = 'activa';
      suscripcion.renovacionAutomatica = true;
      await suscripcion.save();

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
        entidad: 'UsuarioSuscripcion',
        idEntidad: suscripcion._id,
        accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
        datosAnteriores: suscripcionAnterior,
        datosNuevos: suscripcion.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Suscripción reactivada exitosamente',
        data: suscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error reactivando suscripción',
        error: error.message
      });
    }
  }

  // Get user's active subscriptions
  static async getUserActiveSubscriptions(req, res) {
    try {
      const { idUsuario } = req.params;

      const suscripciones = await UsuarioSuscripcion.find({
        idUsuario,
        estado: 'activa',
        fechaFin: { $gte: new Date() }
      })
      .populate([
        { path: 'idSuscripcion', populate: { path: 'idTipoSuscripcion', select: 'codigo nombre' } }
      ])
      .sort({ fechaInicio: -1 });

      res.json({
        success: true,
        data: suscripciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo suscripciones activas del usuario',
        error: error.message
      });
    }
  }

  // Get expiring subscriptions
  static async getExpiringSubscriptions(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      const suscripciones = await UsuarioSuscripcion.find({
        estado: 'activa',
        fechaFin: {
          $gte: new Date(),
          $lte: expirationDate
        }
      })
      .populate([
        { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
        { path: 'idSuscripcion', populate: { path: 'idTipoSuscripcion', select: 'codigo nombre' } }
      ])
      .sort({ fechaFin: 1 });

      res.json({
        success: true,
        data: suscripciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo suscripciones próximas a expirar',
        error: error.message
      });
    }
  }

  // Get subscription statistics
  static async getStats(req, res) {
    try {
      const stats = await UsuarioSuscripcion.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        activas: 0,
        pausadas: 0,
        canceladas: 0,
        expiradas: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de suscripciones',
        error: error.message
      });
    }
  }

  // Setup payment information for user
  static async setupPayment(req, res) {
    try {
      const { idUsuario } = req.params;
      const paymentData = req.body;

      // Check if payment info already exists
      let informacionPago = await InformacionPago.findOne({ idUsuario });

      if (informacionPago) {
        // Update existing payment info
        const infoAnterior = { ...informacionPago.toObject() };
        informacionPago = await InformacionPago.findByIdAndUpdate(
          informacionPago._id,
          paymentData,
          { new: true, runValidators: true }
        );

        // Audit log (non-critical)
        try {
          await UsuarioAuditoria.create({
            entidad: 'InformacionPago',
            idEntidad: informacionPago._id,
            accion: 'UPDATE',
            usuarioId: req.userId || 'sistema',
            datosAnteriores: infoAnterior,
            datosNuevos: informacionPago.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (auditError) {
          console.error('Error en audit log:', auditError.message);
        }
      } else {
        // Create new payment info
        informacionPago = new InformacionPago({
          idUsuario,
          ...paymentData
        });
        await informacionPago.save();

        // Audit log (non-critical)
        try {
          await UsuarioAuditoria.create({
            entidad: 'InformacionPago',
            idEntidad: informacionPago._id,
            accion: 'CREATE',
            usuarioId: req.userId || 'sistema',
            datosNuevos: informacionPago.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (auditError) {
          console.error('Error en audit log:', auditError.message);
        }
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error configurando información de pago',
        error: error.message
      });
    }
  }
}

module.exports = SuscripcionUsuarioController;
