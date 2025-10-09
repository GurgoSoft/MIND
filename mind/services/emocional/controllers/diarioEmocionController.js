const mongoose = require('mongoose');
const DiarioEmocion = require('../../../shared/models/emocional/DiarioEmocion');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class DiarioEmocionController {
  // Get all diary emotions with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.diarioId) filter.diarioId = req.query.diarioId;
      if (req.query.emocionId) filter.emocionId = req.query.emocionId;

            const diarioEmociones = await DiarioEmocion.find(filter)
        .populate('diarioId', 'fecha titulo')
        .populate('emocionId', 'nombre descripcion')
        
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioEmociones,
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
        message: 'Error al obtener emociones del diario',
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Get diary emotion by ID
  static async getById(req, res) {
    try {
      const diarioEmocion = await DiarioEmocion.findById(req.params.id)
        .populate('diarioId', 'fecha titulo')
        .populate('emocionId', 'nombre descripcion');

      if (!diarioEmocion) {
        return res.status(404).json({
          success: false,
          message: 'Emoción del diario no encontrada'
        });
      }

      res.json({
        success: true,
        data: diarioEmocion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener emoción del diario',
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Get emotions by diary ID
  static async getByDiario(req, res) {
    try {
      const diarioEmociones = await DiarioEmocion.find({ diarioId: req.params.diarioId })
        .populate('emocionId', 'nombre descripcion')
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: diarioEmociones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener emociones del diario',
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Create new diary emotion
  static async create(req, res) {
    try {
      // Validate required fields
      const { diarioId, emocionId, intensidad } = req.body;
      if (!diarioId || !emocionId || intensidad === undefined) {
        return res.status(400).json({
          success: false,
          message: 'DiarioId, emocionId e intensidad son requeridos'
        });
      }

      // Validate foreign keys
      const Diario = require('../../../shared/models/emocional/Diario');
      const Emocion = require('../../../shared/models/emocional/Emocion');
      
      const diarioExists = await Diario.findById(diarioId);
      if (!diarioExists) {
        return res.status(400).json({
          success: false,
          message: 'El diario especificado no existe'
        });
      }

      const emocionExists = await Emocion.findById(emocionId);
      if (!emocionExists) {
        return res.status(400).json({
          success: false,
          message: 'La emoción especificada no existe'
        });
      }

      // Check for duplicates
      const existingEntry = await DiarioEmocion.findOne({ diarioId, emocionId });
      if (existingEntry) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una entrada para esta emoción en el diario'
        });
      }

      const diarioEmocion = new DiarioEmocion(req.body);
      await diarioEmocion.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioEmocion',
          idEntidad: diarioEmocion._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: diarioEmocion.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedDiarioEmocion = await DiarioEmocion.findById(diarioEmocion._id)
        .populate('diarioId', 'fecha titulo')
        .populate('emocionId', 'nombre descripcion');

      res.status(201).json({
        success: true,
        message: 'Emoción del diario creada exitosamente',
        data: populatedDiarioEmocion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear emoción del diario',
        error: error.message
      });
    }
  }

  // Update diary emotion
  static async update(req, res) {
    try {
      const diarioEmocionAnterior = await DiarioEmocion.findById(req.params.id);
      if (!diarioEmocionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Emoción del diario no encontrada'
        });
      }

      // Validate foreign keys if changing
      if (req.body.diarioId || req.body.emocionId) {
        const Diario = require('../../../shared/models/emocional/Diario');
        const Emocion = require('../../../shared/models/emocional/Emocion');
        
        if (req.body.diarioId && req.body.diarioId !== diarioEmocionAnterior.diarioId.toString()) {
          const diarioExists = await Diario.findById(req.body.diarioId);
          if (!diarioExists) {
            return res.status(400).json({
              success: false,
              message: 'El diario especificado no existe'
            });
          }
        }

        if (req.body.emocionId && req.body.emocionId !== diarioEmocionAnterior.emocionId.toString()) {
          const emocionExists = await Emocion.findById(req.body.emocionId);
          if (!emocionExists) {
            return res.status(400).json({
              success: false,
              message: 'La emoción especificada no existe'
            });
          }
        }
      }

      const diarioEmocion = await DiarioEmocion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('diarioId', 'fecha titulo')
       .populate('emocionId', 'nombre descripcion');

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioEmocion',
          idEntidad: diarioEmocion._id,
          accion: 'UPDATE',
          datosAnteriores: diarioEmocionAnterior.toObject(),
          datosNuevos: diarioEmocion.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Emoción del diario actualizada exitosamente',
        data: diarioEmocion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar emoción del diario',
        error: error.message
      });
    }
  }

  // Delete diary emotion
  static async delete(req, res) {
    try {
      const diarioEmocion = await DiarioEmocion.findById(req.params.id);
      if (!diarioEmocion) {
        return res.status(404).json({
          success: false,
          message: 'Emoción del diario no encontrada'
        });
      }

      await DiarioEmocion.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'DiarioEmocion',
          idEntidad: req.params.id,
          accion: 'DELETE',
          datosAnteriores: diarioEmocion.toObject(),
          datosNuevos: null,
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Emoción del diario eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar emoción del diario',
        error: error.message
      });
    }
  }
}

module.exports = DiarioEmocionController;
