const mongoose = require('mongoose');
const Notificacion = require('../../../shared/models/administrativo/Notificacion');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');
const Persona = require('../../../shared/models/usuarios/Persona');
const Usuario = require('../../../shared/models/usuarios/Usuario');
const TipoUsuario = require('../../../shared/models/usuarios/TipoUsuario');

class NotificacionController {
  // Get all notificaciones with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.enviado !== undefined) {
        filter.enviado = req.query.enviado === 'true';
      }
      if (req.query.destinatario) {
        filter.destinatario = req.query.destinatario;
      }

      const notificaciones = await Notificacion.find(filter)
        .populate('idTipoNotificacion', 'codigo nombre')
        .populate('destinatario', 'email')
        .sort({ fechaProgramada: -1 })
        ;

            res.json({
        success: true,
        data: notificaciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo notificaciones',
        error: error.message
      });
    }
  }

  // Get notificacion by ID
  static async getById(req, res) {
    try {
      const notificacion = await Notificacion.findById(req.params.id)
        .populate('idTipoNotificacion', 'codigo nombre')
        .populate('destinatario', 'email');
      
      if (!notificacion) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      res.json({
        success: true,
        data: notificacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo notificación',
        error: error.message
      });
    }
  }

  // Create new notificacion
  static async create(req, res) {
    try {
      // Validate required fields
      const { idTipoNotificacion, destinatario, asunto, mensaje } = req.body;
      
      if (!idTipoNotificacion || !destinatario || !asunto || !mensaje) {
        return res.status(400).json({
          success: false,
          message: 'Los campos idTipoNotificacion, destinatario, asunto y mensaje son obligatorios'
        });
      }

      // Check if destinatario exists
      const usuario = await Usuario.findById(destinatario);
      if (!usuario) {
        return res.status(400).json({
          success: false,
          message: 'El usuario destinatario no existe'
        });
      }

      const notificacion = new Notificacion({
        ...req.body,
        fechaCreacion: new Date(),
        usuarioCreacion: req.user?.id || 'sistema'
      });
      
      await notificacion.save();
      
      await notificacion.populate([
        { path: 'idTipoNotificacion', select: 'codigo nombre' },
        { path: 'destinatario', select: 'email' }
      ]);

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Notificacion',
          idEntidad: notificacion._id,
          accion: 'CREATE',
          usuarioId: req.user?.id || 'sistema',
          datosNuevos: notificacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Notificación creada exitosamente',
        data: notificacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando notificación',
        error: error.message
      });
    }
  }

  // Update notificacion
  static async update(req, res) {
    try {
      const notificacionAnterior = await Notificacion.findById(req.params.id);
      
      if (!notificacionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      const notificacion = await Notificacion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: 'idTipoNotificacion', select: 'codigo nombre' },
        { path: 'destinatario', select: 'email' }
      ]);

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Notificacion',
          idEntidad: notificacion._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: notificacionAnterior.toObject(),
          datosNuevos: notificacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Notificación actualizada exitosamente',
        data: notificacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando notificación',
        error: error.message
      });
    }
  }

  // Delete notificacion
  static async delete(req, res) {
    try {
      const notificacion = await Notificacion.findById(req.params.id);
      
      if (!notificacion) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      await Notificacion.findByIdAndDelete(req.params.id);

      // Check if notification has already been sent
      if (notificacion.enviado) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar una notificación que ya ha sido enviada'
        });
      }

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Notificacion',
          idEntidad: notificacion._id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: notificacion.toObject(),
          datosNuevos: null,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Notificación eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando notificación',
        error: error.message
      });
    }
  }

  // Mark notification as sent
  static async markAsSent(req, res) {
    try {
      const notificacion = await Notificacion.findById(req.params.id);
      
      if (!notificacion) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      if (notificacion.enviado) {
        return res.status(400).json({
          success: false,
          message: 'La notificación ya fue marcada como enviada'
        });
      }

      const notificacionAnterior = { ...notificacion.toObject() };
      notificacion.enviado = true;
      notificacion.fechaEnvio = new Date();
      await notificacion.save();

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Notificacion',
          idEntidad: notificacion._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: notificacionAnterior,
          datosNuevos: notificacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Notificación marcada como enviada',
        data: notificacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error marcando notificación como enviada',
        error: error.message
      });
    }
  }

  // Get pending notifications
  static async getPending(req, res) {
    try {
      const notificaciones = await Notificacion.find({
        enviado: false,
        fechaProgramada: { $lte: new Date() }
      })
      .populate('idTipoNotificacion', 'codigo nombre')
      .populate('destinatario', 'email')
      .sort({ fechaProgramada: 1 });

      res.json({
        success: true,
        data: notificaciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo notificaciones pendientes',
        error: error.message
      });
    }
  }

  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const { idUsuario } = req.params;

      const filter = { destinatario: idUsuario };
      if (req.query.enviado !== undefined) {
        filter.enviado = req.query.enviado === 'true';
      }

      const notificaciones = await Notificacion.find(filter)
        .populate('idTipoNotificacion', 'codigo nombre')
        .sort({ fechaProgramada: -1 })
        ;

            res.json({
        success: true,
        data: notificaciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo notificaciones del usuario',
        error: error.message
      });
    }
  }
}

module.exports = NotificacionController;
