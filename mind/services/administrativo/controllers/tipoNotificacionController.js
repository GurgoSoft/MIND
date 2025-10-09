const mongoose = require('mongoose');
const TipoNotificacion = require('../../../shared/models/administrativo/TipoNotificacion');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class TipoNotificacionController {
  // Get all notification types
  static async getAll(req, res) {
    try {
      // Build filter object
      const filter = {};
      if (req.query.nombre) {
        filter.nombre = { $regex: req.query.nombre, $options: 'i' };
      }
      if (req.query.activo !== undefined) {
        filter.activo = req.query.activo === 'true';
      }

      const tiposNotificacion = await TipoNotificacion.find(filter)
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: tiposNotificacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de notificación',
        error: error.message
      });
    }
  }

  // Get notification type by ID
  static async getById(req, res) {
    try {
      const tipoNotificacion = await TipoNotificacion.findById(req.params.id);

      if (!tipoNotificacion) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de notificación no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoNotificacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de notificación',
        error: error.message
      });
    }
  }

  // Create new notification type
  static async create(req, res) {
    try {
      const tipoNotificacion = new TipoNotificacion(req.body);
      await tipoNotificacion.save();

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoNotificacion',
          idEntidad: tipoNotificacion._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: tipoNotificacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Tipo de notificación creado exitosamente',
        data: tipoNotificacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear tipo de notificación',
        error: error.message
      });
    }
  }

  // Update notification type
  static async update(req, res) {
    try {
      const tipoNotificacionAnterior = await TipoNotificacion.findById(req.params.id);
      if (!tipoNotificacionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de notificación no encontrado'
        });
      }

      const tipoNotificacion = await TipoNotificacion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoNotificacion',
          idEntidad: tipoNotificacion._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipoNotificacionAnterior.toObject(),
          datosNuevos: tipoNotificacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de notificación actualizado exitosamente',
        data: tipoNotificacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar tipo de notificación',
        error: error.message
      });
    }
  }

  // Delete notification type
  static async delete(req, res) {
    try {
      const tipoNotificacion = await TipoNotificacion.findById(req.params.id);
      if (!tipoNotificacion) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de notificación no encontrado'
        });
      }

      await TipoNotificacion.findByIdAndDelete(req.params.id);

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoNotificacion',
          idEntidad: tipoNotificacion._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipoNotificacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de notificación eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de notificación',
        error: error.message
      });
    }
  }
}

module.exports = TipoNotificacionController;
