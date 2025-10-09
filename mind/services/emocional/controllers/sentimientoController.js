const mongoose = require('mongoose');
const Sentimiento = require('../../../shared/models/emocional/Sentimiento');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class SentimientoController {
  // Get all sentimientos with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.tipo) {
        filter.tipo = req.query.tipo;
      }

      const sentimientos = await Sentimiento.find(filter)
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: sentimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sentimientos',
        error: error.message
      });
    }
  }

  // Get sentimiento by ID
  static async getById(req, res) {
    try {
      const sentimiento = await Sentimiento.findById(req.params.id);
      
      if (!sentimiento) {
        return res.status(404).json({
          success: false,
          message: 'Sentimiento no encontrado'
        });
      }

      res.json({
        success: true,
        data: sentimiento
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sentimiento',
        error: error.message
      });
    }
  }

  // Create new sentimiento
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
      const existingSentimiento = await Sentimiento.findOne({ nombre: nombre.trim() });
      if (existingSentimiento) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un sentimiento con ese nombre'
        });
      }

      const sentimiento = new Sentimiento(req.body);
      await sentimiento.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sentimiento',
          idEntidad: sentimiento._id,
          accion: 'CREATE',
          usuarioId: req.userId,
          datosNuevos: sentimiento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Sentimiento creado exitosamente',
        data: sentimiento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando sentimiento',
        error: error.message
      });
    }
  }

  // Update sentimiento
  static async update(req, res) {
    try {
      const sentimientoAnterior = await Sentimiento.findById(req.params.id);
      
      if (!sentimientoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Sentimiento no encontrado'
        });
      }

      const sentimiento = await Sentimiento.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Validate duplicate name if changing name
      if (req.body.nombre && req.body.nombre !== sentimientoAnterior.nombre) {
        const existingSentimiento = await Sentimiento.findOne({ 
          nombre: req.body.nombre.trim(),
          _id: { $ne: req.params.id }
        });
        if (existingSentimiento) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un sentimiento con ese nombre'
          });
        }
      }

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sentimiento',
          idEntidad: sentimiento._id,
          accion: 'UPDATE',
          usuarioId: req.userId,
          datosAnteriores: sentimientoAnterior.toObject(),
          datosNuevos: sentimiento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sentimiento actualizado exitosamente',
        data: sentimiento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando sentimiento',
        error: error.message
      });
    }
  }

  // Delete sentimiento
  static async delete(req, res) {
    try {
      const sentimiento = await Sentimiento.findById(req.params.id);
      
      if (!sentimiento) {
        return res.status(404).json({
          success: false,
          message: 'Sentimiento no encontrado'
        });
      }

      await Sentimiento.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sentimiento',
          idEntidad: sentimiento._id,
          accion: 'DELETE',
          usuarioId: req.userId,
          datosAnteriores: sentimiento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sentimiento eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando sentimiento',
        error: error.message
      });
    }
  }

  // Get sentimientos by type
  static async getByType(req, res) {
    try {
      const { tipo } = req.params;

      const sentimientos = await Sentimiento.find({ tipo })
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: sentimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sentimientos por tipo',
        error: error.message
      });
    }
  }
}

module.exports = SentimientoController;
