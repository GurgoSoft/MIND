const mongoose = require('mongoose');
const DiarioSintoma = require('../../../shared/models/emocional/DiarioSintoma');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class DiarioSintomaController {
  // Get all diary symptoms with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.diarioId) filter.diarioId = req.query.diarioId;
      if (req.query.sintomaId) filter.sintomaId = req.query.sintomaId;

            const diarioSintomas = await DiarioSintoma.find(filter)
        .populate('diarioId', 'fecha titulo')
        .populate('sintomaId', 'nombre descripcion')
        
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioSintomas,
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
        message: 'Error al obtener síntomas del diario',
        error: error.message
      });
    }
  }

  // Get diary symptom by ID
  static async getById(req, res) {
    try {
      const diarioSintoma = await DiarioSintoma.findById(req.params.id)
        .populate('diarioId', 'fecha titulo')
        .populate('sintomaId', 'nombre descripcion');

      if (!diarioSintoma) {
        return res.status(404).json({
          success: false,
          message: 'Síntoma del diario no encontrado'
        });
      }

      res.json({
        success: true,
        data: diarioSintoma
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener síntoma del diario',
        error: error.message
      });
    }
  }

  // Get symptoms by diary ID
  static async getByDiario(req, res) {
    try {
      const diarioSintomas = await DiarioSintoma.find({ diarioId: req.params.diarioId })
        .populate('sintomaId', 'nombre descripcion')
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioSintomas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener síntomas del diario',
        error: error.message
      });
    }
  }

  // Create new diary symptom
  static async create(req, res) {
    try {
      // Validate required fields
      const { diarioId, sintomaId, intensidad } = req.body;
      if (!diarioId || !sintomaId || intensidad === undefined) {
        return res.status(400).json({
          success: false,
          message: 'DiarioId, sintomaId e intensidad son requeridos'
        });
      }

      // Validate foreign keys
      const Diario = require('../../../shared/models/emocional/Diario');
      const Sintoma = require('../../../shared/models/emocional/Sintoma');
      
      const diarioExists = await Diario.findById(diarioId);
      if (!diarioExists) {
        return res.status(400).json({
          success: false,
          message: 'El diario especificado no existe'
        });
      }

      const sintomaExists = await Sintoma.findById(sintomaId);
      if (!sintomaExists) {
        return res.status(400).json({
          success: false,
          message: 'El síntoma especificado no existe'
        });
      }

      // Check for duplicates
      const existingEntry = await DiarioSintoma.findOne({ diarioId, sintomaId });
      if (existingEntry) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una entrada para este síntoma en el diario'
        });
      }

      const diarioSintoma = new DiarioSintoma(req.body);
      await diarioSintoma.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSintoma',
          idEntidad: diarioSintoma._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: diarioSintoma.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedDiarioSintoma = await DiarioSintoma.findById(diarioSintoma._id)
        .populate('diarioId', 'fecha titulo')
        .populate('sintomaId', 'nombre descripcion');

      res.status(201).json({
        success: true,
        message: 'Síntoma del diario creado exitosamente',
        data: populatedDiarioSintoma
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear síntoma del diario',
        error: error.message
      });
    }
  }

  // Update diary symptom
  static async update(req, res) {
    try {
      const diarioSintomaAnterior = await DiarioSintoma.findById(req.params.id);
      if (!diarioSintomaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Síntoma del diario no encontrado'
        });
      }

      // Validate foreign keys if changing
      if (req.body.diarioId || req.body.sintomaId) {
        const Diario = require('../../../shared/models/emocional/Diario');
        const Sintoma = require('../../../shared/models/emocional/Sintoma');
        
        if (req.body.diarioId && req.body.diarioId !== diarioSintomaAnterior.diarioId.toString()) {
          const diarioExists = await Diario.findById(req.body.diarioId);
          if (!diarioExists) {
            return res.status(400).json({
              success: false,
              message: 'El diario especificado no existe'
            });
          }
        }

        if (req.body.sintomaId && req.body.sintomaId !== diarioSintomaAnterior.sintomaId.toString()) {
          const sintomaExists = await Sintoma.findById(req.body.sintomaId);
          if (!sintomaExists) {
            return res.status(400).json({
              success: false,
              message: 'El síntoma especificado no existe'
            });
          }
        }
      }

      const diarioSintoma = await DiarioSintoma.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('diarioId', 'fecha titulo')
       .populate('sintomaId', 'nombre descripcion');

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSintoma',
          idEntidad: diarioSintoma._id,
          accion: 'UPDATE',
          datosAnteriores: diarioSintomaAnterior.toObject(),
          datosNuevos: diarioSintoma.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Síntoma del diario actualizado exitosamente',
        data: diarioSintoma
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar síntoma del diario',
        error: error.message
      });
    }
  }

  // Delete diary symptom
  static async delete(req, res) {
    try {
      const diarioSintoma = await DiarioSintoma.findById(req.params.id);
      if (!diarioSintoma) {
        return res.status(404).json({
          success: false,
          message: 'Síntoma del diario no encontrado'
        });
      }

      await DiarioSintoma.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioSintoma',
          idEntidad: req.params.id,
          accion: 'DELETE',
          datosAnteriores: diarioSintoma.toObject(),
          datosNuevos: null,
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Síntoma del diario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar síntoma del diario',
        error: error.message
      });
    }
  }
}

module.exports = DiarioSintomaController;
