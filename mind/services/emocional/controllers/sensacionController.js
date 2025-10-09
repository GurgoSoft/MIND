const mongoose = require('mongoose');
const Sensacion = require('../../../shared/models/emocional/Sensacion');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class SensacionController {
  // Get all sensaciones with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.tipo) {
        filter.tipo = req.query.tipo;
      }

      const sensaciones = await Sensacion.find(filter)
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: sensaciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sensaciones',
        error: error.message
      });
    }
  }

  // Get sensacion by ID
  static async getById(req, res) {
    try {
      const sensacion = await Sensacion.findById(req.params.id);
      
      if (!sensacion) {
        return res.status(404).json({
          success: false,
          message: 'Sensación no encontrada'
        });
      }

      res.json({
        success: true,
        data: sensacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sensación',
        error: error.message
      });
    }
  }

  // Create new sensacion
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, descripcion } = req.body;
      if (!nombre || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y descripción son requeridos'
        });
      }

      // Check for duplicates
      const existingSensacion = await Sensacion.findOne({ nombre: nombre.trim() });
      if (existingSensacion) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una sensación con ese nombre'
        });
      }

      const sensacion = new Sensacion(req.body);
      await sensacion.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sensacion',
          idEntidad: sensacion._id,
          accion: 'CREATE',
          usuarioId: req.userId,
          datosNuevos: sensacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Sensación creada exitosamente',
        data: sensacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando sensación',
        error: error.message
      });
    }
  }

  // Update sensacion
  static async update(req, res) {
    try {
      const sensacionAnterior = await Sensacion.findById(req.params.id);
      
      if (!sensacionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Sensación no encontrada'
        });
      }

      const sensacion = await Sensacion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Validate duplicate name if changing name
      if (req.body.nombre && req.body.nombre !== sensacionAnterior.nombre) {
        const existingSensacion = await Sensacion.findOne({ 
          nombre: req.body.nombre.trim(),
          _id: { $ne: req.params.id }
        });
        if (existingSensacion) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe una sensación con ese nombre'
          });
        }
      }

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sensacion',
          idEntidad: sensacion._id,
          accion: 'UPDATE',
          usuarioId: req.userId,
          datosAnteriores: sensacionAnterior.toObject(),
          datosNuevos: sensacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sensación actualizada exitosamente',
        data: sensacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando sensación',
        error: error.message
      });
    }
  }

  // Delete sensacion
  static async delete(req, res) {
    try {
      const sensacion = await Sensacion.findById(req.params.id);
      
      if (!sensacion) {
        return res.status(404).json({
          success: false,
          message: 'Sensación no encontrada'
        });
      }

      await Sensacion.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sensacion',
          idEntidad: sensacion._id,
          accion: 'DELETE',
          usuarioId: req.userId,
          datosAnteriores: sensacion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sensación eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando sensación',
        error: error.message
      });
    }
  }

  // Get sensaciones by type
  static async getByType(req, res) {
    try {
      const { tipo } = req.params;

      const sensaciones = await Sensacion.find({ tipo })
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: sensaciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sensaciones por tipo',
        error: error.message
      });
    }
  }
}

module.exports = SensacionController;
