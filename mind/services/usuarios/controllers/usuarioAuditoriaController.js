const mongoose = require('mongoose');
const UsuarioAuditoria = require('../../../shared/models/usuarios/UsuarioAuditoria');

class UsuarioAuditoriaController {
  // Get all auditorias
  static async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.entidad) {
        filter.entidad = req.query.entidad;
      }
      if (req.query.accion) {
        filter.accion = req.query.accion;
      }
      if (req.query.usuarioId) {
        filter.usuarioId = req.query.usuarioId;
      }
      if (req.query.idEntidad) {
        filter.idEntidad = req.query.idEntidad;
      }
      if (req.query.fechaDesde) {
        filter.createdAt = { ...filter.createdAt, $gte: new Date(req.query.fechaDesde) };
      }
      if (req.query.fechaHasta) {
        filter.createdAt = { ...filter.createdAt, $lte: new Date(req.query.fechaHasta) };
      }

      const auditorias = await UsuarioAuditoria.find(filter)
        .populate({ path: 'usuarioId', select: 'email' })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: auditorias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo auditorías',
        error: error.message
      });
    }
  }

  // Get auditoria by ID
  static async getById(req, res) {
    try {
      const auditoria = await UsuarioAuditoria.findById(req.params.id)
        .populate({ path: 'usuarioId', select: 'email' });
      
      if (!auditoria) {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }

      res.json({
        success: true,
        data: auditoria
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo auditoría',
        error: error.message
      });
    }
  }

  // Get auditorias by entity and entity ID
  static async getByEntity(req, res) {
    try {
      const { entidad, idEntidad } = req.params;
      const filter = { entidad, idEntidad };
      if (req.query.accion) {
        filter.accion = req.query.accion;
      }

      const auditorias = await UsuarioAuditoria.find(filter)
        .populate({ path: 'usuarioId', select: 'email' })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: auditorias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo auditorías de la entidad',
        error: error.message
      });
    }
  }

  // Get auditorias by user
  static async getByUser(req, res) {
    try {
      const { usuarioId } = req.params;

      const filter = { usuarioId };
      if (req.query.entidad) {
        filter.entidad = req.query.entidad;
      }
      if (req.query.accion) {
        filter.accion = req.query.accion;
      }

      const auditorias = await UsuarioAuditoria.find(filter)
        .populate({ path: 'usuarioId', select: 'email' })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: auditorias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo auditorías del usuario',
        error: error.message
      });
    }
  }

  // Get audit statistics
  static async getStats(req, res) {
    try {
      const stats = await UsuarioAuditoria.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            porAccion: {
              $push: {
                accion: '$accion',
                count: 1
              }
            },
            porEntidad: {
              $push: {
                entidad: '$entidad',
                count: 1
              }
            }
          }
        },
        {
          $project: {
            total: 1,
            porAccion: {
              $reduce: {
                input: '$porAccion',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [[{
                        k: '$$this.accion',
                        v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.accion', input: '$$value' } }, 0] }, 1] }
                      }]]
                    }
                  ]
                }
              }
            },
            porEntidad: {
              $reduce: {
                input: '$porEntidad',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [[{
                        k: '$$this.entidad',
                        v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.entidad', input: '$$value' } }, 0] }, 1] }
                      }]]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        porAccion: {},
        porEntidad: {}
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de auditoría',
        error: error.message
      });
    }
  }

  // Delete old audit records (cleanup)
  static async cleanup(req, res) {
    try {
      const { days = 365 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      const result = await UsuarioAuditoria.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      res.json({
        success: true,
        message: `Limpieza completada. ${result.deletedCount} registros eliminados`,
        data: {
          deletedCount: result.deletedCount,
          cutoffDate
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en limpieza de auditorías',
        error: error.message
      });
    }
  }
}

module.exports = UsuarioAuditoriaController;
