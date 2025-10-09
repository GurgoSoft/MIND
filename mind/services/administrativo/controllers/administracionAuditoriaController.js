const mongoose = require('mongoose');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class AdministracionAuditoriaController {
  // Get all audit records with pagination and filtering
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

            const auditorias = await AdministracionAuditoria.find(filter)
        
        .sort({ fecha: -1 });

      res.json({
        success: true,
        data: auditorias,
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
        message: 'Error al obtener registros de auditoría',
        error: error.message
      });
    }
  }

  // Get audit record by ID
  static async getById(req, res) {
    try {
      const auditoria = await AdministracionAuditoria.findById(req.params.id);

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
      
      const auditorias = await AdministracionAuditoria.find({
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
      const auditorias = await AdministracionAuditoria.find({
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
      const stats = await AdministracionAuditoria.aggregate([
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

      const result = await AdministracionAuditoria.deleteMany({
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

  // Track a custom audit event (e.g., LOGIN after autenticación)
  static async track(req, res) {
    try {
      const { entidad, idEntidad, accion, datosAnteriores, datosNuevos } = req.body;

      const registro = await AdministracionAuditoria.create({
        entidad,
        idEntidad,
        accion,
        usuarioId: req.userId || req.user?._id,
        datosAnteriores: datosAnteriores || undefined,
        datosNuevos: datosNuevos || undefined,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        fecha: new Date(),
      });

      res.status(201).json({ success: true, data: registro });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error registrando auditoría',
        error: error.message,
      });
    }
  }
}

module.exports = AdministracionAuditoriaController;
