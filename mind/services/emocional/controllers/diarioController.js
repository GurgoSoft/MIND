const mongoose = require('mongoose');
const Diario = require('../../../shared/models/emocional/Diario');
const DiarioEmocion = require('../../../shared/models/emocional/DiarioEmocion');
const DiarioSensacion = require('../../../shared/models/emocional/DiarioSensacion');
const DiarioSintoma = require('../../../shared/models/emocional/DiarioSintoma');
const DiarioSentimiento = require('../../../shared/models/emocional/DiarioSentimiento');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class DiarioController {
  // Get all diarios with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.idUsuario) {
        filter.idUsuario = req.query.idUsuario;
      }
      if (req.query.fechaInicio && req.query.fechaFin) {
        filter.fecha = {
          $gte: new Date(req.query.fechaInicio),
          $lte: new Date(req.query.fechaFin)
        };
      }

      const diarios = await Diario.find(filter)
        .populate('idUsuario', 'email')
        .sort({ fecha: -1 })
        ;

            res.json({
        success: true,
        data: diarios
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo diarios',
        error: error.message
      });
    }
  }

  // Get diario by ID with all related data
  static async getById(req, res) {
    try {
      const diario = await Diario.findById(req.params.id)
        .populate('idUsuario', 'email');
      
      if (!diario) {
        return res.status(404).json({
          success: false,
          message: 'Diario no encontrado'
        });
      }

      // Get related emotions, sensations, symptoms, and feelings
      const [emociones, sensaciones, sintomas, sentimientos] = await Promise.all([
        DiarioEmocion.find({ idDiario: diario._id }).populate('idEmocion', 'nombre'),
        DiarioSensacion.find({ idDiario: diario._id }).populate('idSensacion', 'nombre'),
        DiarioSintoma.find({ idDiario: diario._id }).populate('idSintoma', 'nombre'),
        DiarioSentimiento.find({ idDiario: diario._id }).populate('idSentimiento', 'nombre')
      ]);

      res.json({
        success: true,
        data: {
          diario,
          emociones,
          sensaciones,
          sintomas,
          sentimientos
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo diario',
        error: error.message
      });
    }
  }

  // Create new diario with related data
  static async create(req, res) {
    try {
      const { diario, emociones = [], sensaciones = [], sintomas = [], sentimientos = [] } = req.body;

      // Validate required fields for diary
      if (!diario || !diario.fecha || !diario.titulo) {
        return res.status(400).json({
          success: false,
          message: 'Fecha y título del diario son requeridos'
        });
      }

      // Validate foreign keys for related entries
      const Emocion = require('../../../shared/models/emocional/Emocion');
      const Sensacion = require('../../../shared/models/emocional/Sensacion');
      const Sintoma = require('../../../shared/models/emocional/Sintoma');
      const Sentimiento = require('../../../shared/models/emocional/Sentimiento');

      // Validate emotions
      if (emociones.length > 0) {
        for (const emocion of emociones) {
          if (!emocion.idEmocion || emocion.intensidad === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Cada emoción debe tener idEmocion e intensidad'
            });
          }
          const emocionExists = await Emocion.findById(emocion.idEmocion);
          if (!emocionExists) {
            return res.status(400).json({
              success: false,
              message: `La emoción con ID ${emocion.idEmocion} no existe`
            });
          }
        }
      }

      // Validate sensations
      if (sensaciones.length > 0) {
        for (const sensacion of sensaciones) {
          if (!sensacion.idSensacion || sensacion.intensidad === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Cada sensación debe tener idSensacion e intensidad'
            });
          }
          const sensacionExists = await Sensacion.findById(sensacion.idSensacion);
          if (!sensacionExists) {
            return res.status(400).json({
              success: false,
              message: `La sensación con ID ${sensacion.idSensacion} no existe`
            });
          }
        }
      }

      // Validate symptoms
      if (sintomas.length > 0) {
        for (const sintoma of sintomas) {
          if (!sintoma.idSintoma || sintoma.intensidad === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Cada síntoma debe tener idSintoma e intensidad'
            });
          }
          const sintomaExists = await Sintoma.findById(sintoma.idSintoma);
          if (!sintomaExists) {
            return res.status(400).json({
              success: false,
              message: `El síntoma con ID ${sintoma.idSintoma} no existe`
            });
          }
        }
      }

      // Validate feelings
      if (sentimientos.length > 0) {
        for (const sentimiento of sentimientos) {
          if (!sentimiento.idSentimiento || sentimiento.intensidad === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Cada sentimiento debe tener idSentimiento e intensidad'
            });
          }
          const sentimientoExists = await Sentimiento.findById(sentimiento.idSentimiento);
          if (!sentimientoExists) {
            return res.status(400).json({
              success: false,
              message: `El sentimiento con ID ${sentimiento.idSentimiento} no existe`
            });
          }
        }
      }

      // Create the diary entry
      const nuevoDiario = new Diario(diario);
      await nuevoDiario.save();

      // Create related entries
      const promises = [];

      // Add emotions
      if (emociones.length > 0) {
        const emocionesData = emociones.map(emocion => ({
          diarioId: nuevoDiario._id,
          emocionId: emocion.idEmocion,
          intensidad: emocion.intensidad
        }));
        promises.push(DiarioEmocion.insertMany(emocionesData));
      }

      // Add sensations
      if (sensaciones.length > 0) {
        const sensacionesData = sensaciones.map(sensacion => ({
          diarioId: nuevoDiario._id,
          sensacionId: sensacion.idSensacion,
          intensidad: sensacion.intensidad
        }));
        promises.push(DiarioSensacion.insertMany(sensacionesData));
      }

      // Add symptoms
      if (sintomas.length > 0) {
        const sintomasData = sintomas.map(sintoma => ({
          diarioId: nuevoDiario._id,
          sintomaId: sintoma.idSintoma,
          intensidad: sintoma.intensidad
        }));
        promises.push(DiarioSintoma.insertMany(sintomasData));
      }

      // Add feelings
      if (sentimientos.length > 0) {
        const sentimientosData = sentimientos.map(sentimiento => ({
          diarioId: nuevoDiario._id,
          sentimientoId: sentimiento.idSentimiento,
          intensidad: sentimiento.intensidad
        }));
        promises.push(DiarioSentimiento.insertMany(sentimientosData));
      }

      await Promise.all(promises);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Diario',
          idEntidad: nuevoDiario._id,
          accion: 'CREATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosNuevos: {
            diario: nuevoDiario.toObject(),
            emociones,
            sensaciones,
            sintomas,
            sentimientos
          },
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Diario creado exitosamente',
        data: nuevoDiario
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando diario',
        error: error.message
      });
    }
  }

  // Update diario
  static async update(req, res) {
    try {
      const diarioAnterior = await Diario.findById(req.params.id);
      
      if (!diarioAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Diario no encontrado'
        });
      }

      const { diario, emociones, sensaciones, sintomas, sentimientos } = req.body;

      // Update diary entry
      const diarioActualizado = await Diario.findByIdAndUpdate(
        req.params.id,
        diario,
        { new: true, runValidators: true }
      );

      // Update related entries if provided
      if (emociones !== undefined) {
        await DiarioEmocion.deleteMany({ diarioId: req.params.id });
        if (emociones.length > 0) {
          const emocionesData = emociones.map(emocion => ({
            diarioId: req.params.id,
            emocionId: emocion.idEmocion,
            intensidad: emocion.intensidad
          }));
          await DiarioEmocion.insertMany(emocionesData);
        }
      }

      if (sensaciones !== undefined) {
        await DiarioSensacion.deleteMany({ diarioId: req.params.id });
        if (sensaciones.length > 0) {
          const sensacionesData = sensaciones.map(sensacion => ({
            diarioId: req.params.id,
            sensacionId: sensacion.idSensacion,
            intensidad: sensacion.intensidad
          }));
          await DiarioSensacion.insertMany(sensacionesData);
        }
      }

      if (sintomas !== undefined) {
        await DiarioSintoma.deleteMany({ diarioId: req.params.id });
        if (sintomas.length > 0) {
          const sintomasData = sintomas.map(sintoma => ({
            diarioId: req.params.id,
            sintomaId: sintoma.idSintoma,
            intensidad: sintoma.intensidad
          }));
          await DiarioSintoma.insertMany(sintomasData);
        }
      }

      if (sentimientos !== undefined) {
        await DiarioSentimiento.deleteMany({ diarioId: req.params.id });
        if (sentimientos.length > 0) {
          const sentimientosData = sentimientos.map(sentimiento => ({
            diarioId: req.params.id,
            sentimientoId: sentimiento.idSentimiento,
            intensidad: sentimiento.intensidad
          }));
          await DiarioSentimiento.insertMany(sentimientosData);
        }
      }

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Diario',
          idEntidad: req.params.id,
          accion: 'UPDATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: diarioAnterior.toObject(),
          datosNuevos: diarioActualizado.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Diario actualizado exitosamente',
        data: diarioActualizado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando diario',
        error: error.message
      });
    }
  }

  // Delete diario
  static async delete(req, res) {
    try {
      const diario = await Diario.findById(req.params.id);
      
      if (!diario) {
        return res.status(404).json({
          success: false,
          message: 'Diario no encontrado'
        });
      }

      // Delete related entries
      await Promise.all([
        DiarioEmocion.deleteMany({ diarioId: req.params.id }),
        DiarioSensacion.deleteMany({ diarioId: req.params.id }),
        DiarioSintoma.deleteMany({ diarioId: req.params.id }),
        DiarioSentimiento.deleteMany({ diarioId: req.params.id })
      ]);

      // Delete diary entry
      await Diario.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Diario',
          idEntidad: diario._id,
          accion: 'DELETE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: diario.toObject(),
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
        message: 'Diario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando diario',
        error: error.message
      });
    }
  }

  // Get user diary statistics
  static async getUserStats(req, res) {
    try {
      const { idUsuario } = req.params;
      const { fechaInicio, fechaFin } = req.query;

      const filter = { idUsuario };
      if (fechaInicio && fechaFin) {
        filter.fecha = {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        };
      }

      const stats = await Diario.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            avgRating: { $avg: '$calificacion' },
            maxRating: { $max: '$calificacion' },
            minRating: { $min: '$calificacion' }
          }
        }
      ]);

      const result = stats[0] || {
        totalEntries: 0,
        avgRating: 0,
        maxRating: 0,
        minRating: 0
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas del diario',
        error: error.message
      });
    }
  }
}

module.exports = DiarioController;
