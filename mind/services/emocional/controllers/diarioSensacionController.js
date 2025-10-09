const mongoose = require('mongoose');
const DiarioSensacion = require('../../../shared/models/emocional/DiarioSensacion');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class DiarioSensacionController {
  // Get all diary sensations with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.diarioId) filter.diarioId = req.query.diarioId;
      if (req.query.sensacionId) filter.sensacionId = req.query.sensacionId;

            const diarioSensaciones = await DiarioSensacion.find(filter)
        .populate('diarioId', 'fecha titulo')
        .populate('sensacionId', 'nombre descripcion')
        
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioSensaciones,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener sensaciones del diario',
        error: error.message
      });
    }
  }

  // Get diary sensation by ID
  static async getById(req, res) {
    try {
      const diarioSensacion = await DiarioSensacion.findById(req.params.id)
        .populate('diarioId', 'fecha titulo')
        .populate('sensacionId', 'nombre descripcion');

      if (!diarioSensacion) {
        return res.status(404).json({
          success: false,
          message: 'Sensación del diario no encontrada'
        });
      }

      res.json({
        success: true,
        data: diarioSensacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener sensación del diario',
        error: error.message
      });
    }
  }

  // Get sensations by diary ID
  static async getByDiario(req, res) {
    try {
      const diarioSensaciones = await DiarioSensacion.find({ diarioId: req.params.diarioId })
        .populate('sensacionId', 'nombre descripcion')
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioSensaciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener sensaciones del diario',
        error: error.message
      });
    }
  }

  // Create new diary sensation
  static async create(req, res) {
    try {
      // Validate required fields
      const { diarioId, sensacionId, intensidad } = req.body;
      if (!diarioId || !sensacionId || intensidad === undefined) {
        return res.status(400).json({
          success: false,
          message: 'DiarioId, sensacionId e intensidad son requeridos'
        });
      }

      // Validate foreign keys
      const Diario = require('../../../shared/models/emocional/Diario');
      const Sensacion = require('../../../shared/models/emocional/Sensacion');
      
      const diarioExists = await Diario.findById(diarioId);
      if (!diarioExists) {
        return res.status(400).json({
          success: false,
          message: 'El diario especificado no existe'
        });
      }

      const sensacionExists = await Sensacion.findById(sensacionId);
      if (!sensacionExists) {
        return res.status(400).json({
          success: false,
          message: 'La sensación especificada no existe'
        });
      }

      // Check for duplicates
      const existingEntry = await DiarioSensacion.findOne({ diarioId, sensacionId });
      if (existingEntry) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una entrada para esta sensación en el diario'
        });
      }

      const diarioSensacion = new DiarioSensacion(req.body);
      await diarioSensacion.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSensacion',
          idEntidad: diarioSensacion._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: diarioSensacion.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedDiarioSensacion = await DiarioSensacion.findById(diarioSensacion._id)
        .populate('diarioId', 'fecha titulo')
        .populate('sensacionId', 'nombre descripcion');

      res.status(201).json({
        success: true,
        message: 'Sensación del diario creada exitosamente',
        data: populatedDiarioSensacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear sensación del diario',
        error: error.message
      });
    }
  }

  // Update diary sensation
  static async update(req, res) {
    try {
      const diarioSensacionAnterior = await DiarioSensacion.findById(req.params.id);
      if (!diarioSensacionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Sensación del diario no encontrada'
        });
      }

      // Validate foreign keys if changing
      if (req.body.diarioId || req.body.sensacionId) {
        const Diario = require('../../../shared/models/emocional/Diario');
        const Sensacion = require('../../../shared/models/emocional/Sensacion');
        
        if (req.body.diarioId && req.body.diarioId !== diarioSensacionAnterior.diarioId.toString()) {
          const diarioExists = await Diario.findById(req.body.diarioId);
          if (!diarioExists) {
            return res.status(400).json({
              success: false,
              message: 'El diario especificado no existe'
            });
          }
        }

        if (req.body.sensacionId && req.body.sensacionId !== diarioSensacionAnterior.sensacionId.toString()) {
          const sensacionExists = await Sensacion.findById(req.body.sensacionId);
          if (!sensacionExists) {
            return res.status(400).json({
              success: false,
              message: 'La sensación especificada no existe'
            });
          }
        }
      }

      const diarioSensacion = await DiarioSensacion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('diarioId', 'fecha titulo')
       .populate('sensacionId', 'nombre descripcion');

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSensacion',
          idEntidad: diarioSensacion._id,
          accion: 'UPDATE',
          datosAnteriores: diarioSensacionAnterior.toObject(),
          datosNuevos: diarioSensacion.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sensación del diario actualizada exitosamente',
        data: diarioSensacion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar sensación del diario',
        error: error.message
      });
    }
  }

  // Delete diary sensation
  static async delete(req, res) {
    try {
      const diarioSensacion = await DiarioSensacion.findById(req.params.id);
      if (!diarioSensacion) {
        return res.status(404).json({
          success: false,
          message: 'Sensación del diario no encontrada'
        });
      }

      await DiarioSensacion.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSensacion',
          idEntidad: req.params.id,
          accion: 'DELETE',
          datosAnteriores: diarioSensacion.toObject(),
          datosNuevos: null,
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sensación del diario eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar sensación del diario',
        error: error.message
      });
    }
  }
}

module.exports = DiarioSensacionController;
