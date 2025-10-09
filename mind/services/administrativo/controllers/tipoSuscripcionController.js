const mongoose = require('mongoose');
const TipoSuscripcion = require('../../../shared/models/administrativo/TipoSuscripcion');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class TipoSuscripcionController {
  // Get all subscription types with pagination and filtering
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

            const tiposSuscripcion = await TipoSuscripcion.find(filter)
        
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: tiposSuscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de suscripción',
        error: error.message
      });
    }
  }

  // Get subscription type by ID
  static async getById(req, res) {
    try {
      const tipoSuscripcion = await TipoSuscripcion.findById(req.params.id);

      if (!tipoSuscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de suscripción no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoSuscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de suscripción',
        error: error.message
      });
    }
  }

  // Create new subscription type
  static async create(req, res) {
    try {
      const tipoSuscripcion = new TipoSuscripcion(req.body);
      await tipoSuscripcion.save();

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoSuscripcion',
          idEntidad: tipoSuscripcion._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: tipoSuscripcion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Tipo de suscripción creado exitosamente',
        data: tipoSuscripcion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear tipo de suscripción',
        error: error.message
      });
    }
  }

  // Update subscription type
  static async update(req, res) {
    try {
      const tipoSuscripcionAnterior = await TipoSuscripcion.findById(req.params.id);
      if (!tipoSuscripcionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de suscripción no encontrado'
        });
      }

      const tipoSuscripcion = await TipoSuscripcion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoSuscripcion',
          idEntidad: tipoSuscripcion._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipoSuscripcionAnterior.toObject(),
          datosNuevos: tipoSuscripcion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de suscripción actualizado exitosamente',
        data: tipoSuscripcion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar tipo de suscripción',
        error: error.message
      });
    }
  }

  // Delete subscription type
  static async delete(req, res) {
    try {
      const tipoSuscripcion = await TipoSuscripcion.findById(req.params.id);
      if (!tipoSuscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de suscripción no encontrado'
        });
      }

      await TipoSuscripcion.findByIdAndDelete(req.params.id);

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoSuscripcion',
          idEntidad: tipoSuscripcion._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipoSuscripcion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de suscripción eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de suscripción',
        error: error.message
      });
    }
  }
}

module.exports = TipoSuscripcionController;
