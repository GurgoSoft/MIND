const mongoose = require('mongoose');
const DiarioSentimiento = require('../../../shared/models/emocional/DiarioSentimiento');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class DiarioSentimientoController {
  // Get all diary feelings with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.diarioId) filter.diarioId = req.query.diarioId;
      if (req.query.sentimientoId) filter.sentimientoId = req.query.sentimientoId;

            const diarioSentimientos = await DiarioSentimiento.find(filter)
        .populate('diarioId', 'fecha titulo')
        .populate('sentimientoId', 'nombre descripcion')
        
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioSentimientos,
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
        message: 'Error al obtener sentimientos del diario',
        error: error.message
      });
    }
  }

  // Get diary feeling by ID
  static async getById(req, res) {
    try {
      const diarioSentimiento = await DiarioSentimiento.findById(req.params.id)
        .populate('diarioId', 'fecha titulo')
        .populate('sentimientoId', 'nombre descripcion');

      if (!diarioSentimiento) {
        return res.status(404).json({
          success: false,
          message: 'Sentimiento del diario no encontrado'
        });
      }

      res.json({
        success: true,
        data: diarioSentimiento
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener sentimiento del diario',
        error: error.message
      });
    }
  }

  // Get feelings by diary ID
  static async getByDiario(req, res) {
    try {
      const diarioSentimientos = await DiarioSentimiento.find({ diarioId: req.params.diarioId })
        .populate('sentimientoId', 'nombre descripcion')
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioSentimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener sentimientos del diario',
        error: error.message
      });
    }
  }

  // Create new diary feeling
  static async create(req, res) {
    try {
      // Validate required fields
      const { diarioId, sentimientoId, intensidad } = req.body;
      if (!diarioId || !sentimientoId || intensidad === undefined) {
        return res.status(400).json({
          success: false,
          message: 'DiarioId, sentimientoId e intensidad son requeridos'
        });
      }

      // Validate foreign keys
      const Diario = require('../../../shared/models/emocional/Diario');
      const Sentimiento = require('../../../shared/models/emocional/Sentimiento');
      
      const diarioExists = await Diario.findById(diarioId);
      if (!diarioExists) {
        return res.status(400).json({
          success: false,
          message: 'El diario especificado no existe'
        });
      }

      const sentimientoExists = await Sentimiento.findById(sentimientoId);
      if (!sentimientoExists) {
        return res.status(400).json({
          success: false,
          message: 'El sentimiento especificado no existe'
        });
      }

      // Check for duplicates
      const existingEntry = await DiarioSentimiento.findOne({ diarioId, sentimientoId });
      if (existingEntry) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una entrada para este sentimiento en el diario'
        });
      }

      const diarioSentimiento = new DiarioSentimiento(req.body);
      await diarioSentimiento.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSentimiento',
          idEntidad: diarioSentimiento._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: diarioSentimiento.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedDiarioSentimiento = await DiarioSentimiento.findById(diarioSentimiento._id)
        .populate('diarioId', 'fecha titulo')
        .populate('sentimientoId', 'nombre descripcion');

      res.status(201).json({
        success: true,
        message: 'Sentimiento del diario creado exitosamente',
        data: populatedDiarioSentimiento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear sentimiento del diario',
        error: error.message
      });
    }
  }

  // Update diary sentiment
  static async update(req, res) {
    try {
      const diarioSentimientoAnterior = await DiarioSentimiento.findById(req.params.id);
      if (!diarioSentimientoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Sentimiento del diario no encontrado'
        });
      }

      // Validate foreign keys if changing
      if (req.body.diarioId || req.body.sentimientoId) {
        const Diario = require('../../../shared/models/emocional/Diario');
        const Sentimiento = require('../../../shared/models/emocional/Sentimiento');
        
        if (req.body.diarioId && req.body.diarioId !== diarioSentimientoAnterior.diarioId.toString()) {
          const diarioExists = await Diario.findById(req.body.diarioId);
          if (!diarioExists) {
            return res.status(400).json({
              success: false,
              message: 'El diario especificado no existe'
            });
          }
        }

        if (req.body.sentimientoId && req.body.sentimientoId !== diarioSentimientoAnterior.sentimientoId.toString()) {
          const sentimientoExists = await Sentimiento.findById(req.body.sentimientoId);
          if (!sentimientoExists) {
            return res.status(400).json({
              success: false,
              message: 'El sentimiento especificado no existe'
            });
          }
        }
      }

      const diarioSentimiento = await DiarioSentimiento.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('diarioId', 'fecha titulo')
       .populate('sentimientoId', 'nombre descripcion');

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSentimiento',
          idEntidad: diarioSentimiento._id,
          accion: 'UPDATE',
          datosAnteriores: diarioSentimientoAnterior.toObject(),
          datosNuevos: diarioSentimiento.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sentimiento del diario actualizado exitosamente',
        data: diarioSentimiento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar sentimiento del diario',
        error: error.message
      });
    }
  }

  // Delete diary sentiment
  static async delete(req, res) {
    try {
      const diarioSentimiento = await DiarioSentimiento.findById(req.params.id);
      if (!diarioSentimiento) {
        return res.status(404).json({
          success: false,
          message: 'Sentimiento del diario no encontrado'
        });
      }

      await DiarioSentimiento.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSentimiento',
          idEntidad: req.params.id,
          accion: 'DELETE',
          datosAnteriores: diarioSentimiento.toObject(),
          datosNuevos: null,
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Sentimiento del diario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar sentimiento del diario',
        error: error.message
      });
    }
  }
}

module.exports = DiarioSentimientoController;
