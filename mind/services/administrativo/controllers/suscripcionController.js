const mongoose = require('mongoose');
const Suscripcion = require('../../../shared/models/administrativo/Suscripcion');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class SuscripcionController {
  // Get all suscripciones with pagination
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.activo !== undefined) {
        filter.activo = req.query.activo === 'true';
      }

      const suscripciones = await Suscripcion.find(filter)
        .populate('idTipoSuscripcion', 'codigo nombre')
        .sort({ nombrePlan: 1 })
        ;

            res.json({
        success: true,
        data: suscripciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo suscripciones',
        error: error.message
      });
    }
  }

  // Get suscripcion by ID
  static async getById(req, res) {
    try {
      const suscripcion = await Suscripcion.findById(req.params.id)
        .populate('idTipoSuscripcion', 'codigo nombre');
      
      if (!suscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      res.json({
        success: true,
        data: suscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo suscripción',
        error: error.message
      });
    }
  }

  // Create new suscripcion
  static async create(req, res) {
    try {
      const suscripcion = new Suscripcion(req.body);
      await suscripcion.save();
      
      await suscripcion.populate('idTipoSuscripcion', 'codigo nombre');

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Suscripcion',
          idEntidad: suscripcion._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: suscripcion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Suscripción creada exitosamente',
        data: suscripcion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando suscripción',
        error: error.message
      });
    }
  }

  // Update suscripcion
  static async update(req, res) {
    try {
      const suscripcionAnterior = await Suscripcion.findById(req.params.id);
      
      if (!suscripcionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      const suscripcion = await Suscripcion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('idTipoSuscripcion', 'codigo nombre');

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Suscripcion',
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
        message: 'Suscripción actualizada exitosamente',
        data: suscripcion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando suscripción',
        error: error.message
      });
    }
  }

  // Delete suscripcion
  static async delete(req, res) {
    try {
      const suscripcion = await Suscripcion.findById(req.params.id);
      
      if (!suscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      await Suscripcion.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Suscripcion',
          idEntidad: suscripcion._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: suscripcion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Suscripción eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando suscripción',
        error: error.message
      });
    }
  }

  // Toggle active status
  static async toggleActive(req, res) {
    try {
      const suscripcion = await Suscripcion.findById(req.params.id);
      
      if (!suscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      const suscripcionAnterior = { ...suscripcion.toObject() };
      suscripcion.activo = !suscripcion.activo;
      await suscripcion.save();

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Suscripcion',
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
        message: `Suscripción ${suscripcion.activo ? 'activada' : 'desactivada'} exitosamente`,
        data: suscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado de suscripción',
        error: error.message
      });
    }
  }
}

module.exports = SuscripcionController;
