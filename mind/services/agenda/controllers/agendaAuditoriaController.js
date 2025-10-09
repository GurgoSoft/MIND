const mongoose = require('mongoose');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class AgendaAuditoriaController {
  // Get all agenda audit records with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.entidad) filter.entidad = req.query.entidad;
      if (req.query.accion) filter.accion = req.query.accion;
      if (req.query.usuarioId) filter.usuarioId = req.query.usuarioId;
      if (req.query.fechaDesde || req.query.fechaHasta) {
        filter.fecha = {};
        if (req.query.fechaDesde) filter.fecha.$gte = new Date(req.query.fechaDesde);
        if (req.query.fechaHasta) filter.fecha.$lte = new Date(req.query.fechaHasta);
      }

            const auditorias = await AgendaAuditoria.find(filter)
        
        .sort({ fecha: -1 });

      res.json({
        success: true,
        data: auditorias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registros de auditoría de agenda',
        error: error.message
      });
    }
  }

  // Get audit record by ID
  static async getById(req, res) {
    try {
      const auditoria = await AgendaAuditoria.findById(req.params.id);

      if (!auditoria) {
        return res.status(404).json({
          success: false,
          message: 'Registro de auditoría no encontrado'
        });
      }

      res.json({
        success: true,
        data: auditoria
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registro de auditoría',
        error: error.message
      });
    }
  }

  // Get audit records by entity and entity ID
  static async getByEntidad(req, res) {
    try {
      const { entidad, idEntidad } = req.params;
      
      const auditorias = await AgendaAuditoria.find({
        entidad: entidad,
        idEntidad: idEntidad
      }).sort({ fecha: -1 });

      res.json({
        success: true,
        data: auditorias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registros de auditoría por entidad',
        error: error.message
      });
    }
  }

  // Get audit records by user
  static async getByUsuario(req, res) {
    try {
      const auditorias = await AgendaAuditoria.find({
        usuarioId: req.params.usuarioId
      }).sort({ fecha: -1 });

      res.json({
        success: true,
        data: auditorias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registros de auditoría por usuario',
        error: error.message
      });
    }
  }

  // Get audit statistics
  static async getStats(req, res) {
    try {
      const stats = await AgendaAuditoria.aggregate([
        {
          $group: {
            _id: {
              entidad: '$entidad',
              accion: '$accion'
            },
            count: { $sum: 1 },
            ultimaFecha: { $max: '$fecha' }
          }
        },
        {
          $group: {
            _id: '$_id.entidad',
            acciones: {
              $push: {
                accion: '$_id.accion',
                count: '$count',
                ultimaFecha: '$ultimaFecha'
              }
            },
            totalOperaciones: { $sum: '$count' }
          }
        },
        {
          $sort: { totalOperaciones: -1 }
        }
      ]);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de auditoría',
        error: error.message
      });
    }
  }

  // Clean old audit records (older than specified days)
  static async cleanup(req, res) {
    try {
      const days = parseInt(req.query.days) || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await AgendaAuditoria.deleteMany({
        fecha: { $lt: cutoffDate }
      });

      res.json({
        success: true,
        message: `Limpieza completada. ${result.deletedCount} registros eliminados`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al limpiar registros de auditoría',
        error: error.message
      });
    }
  }
}

module.exports = AgendaAuditoriaController;
