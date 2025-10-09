const mongoose = require('mongoose');
const AgendaDia = require('../../../shared/models/agenda/AgendaDia');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class AgendaDiaController {
  // Get all agenda days with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.agendaId) filter.agendaId = req.query.agendaId;
      if (req.query.fecha) filter.fecha = new Date(req.query.fecha);
      if (req.query.disponible !== undefined) filter.disponible = req.query.disponible === 'true';

            const agendaDias = await AgendaDia.find(filter)
        .populate('agendaId', 'nombre descripcion')
        
        .sort({ fecha: -1 });

      res.json({
        success: true,
        data: agendaDias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener días de agenda',
        error: error.message
      });
    }
  }

  // Get agenda day by ID
  static async getById(req, res) {
    try {
      const agendaDia = await AgendaDia.findById(req.params.id)
        .populate('agendaId', 'nombre descripcion');

      if (!agendaDia) {
        return res.status(404).json({
          success: false,
          message: 'Día de agenda no encontrado'
        });
      }

      res.json({
        success: true,
        data: agendaDia
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener día de agenda',
        error: error.message
      });
    }
  }

  // Get agenda days by agenda ID
  static async getByAgenda(req, res) {
    try {
      const agendaDias = await AgendaDia.find({ agendaId: req.params.agendaId })
        .sort({ fecha: 1 });

      res.json({
        success: true,
        data: agendaDias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener días de agenda por agenda',
        error: error.message
      });
    }
  }

  // Create new agenda day
  static async create(req, res) {
    try {
      // Validate required fields
      const { fecha, horaInicio, horaFin, agendaId } = req.body;
      if (!fecha || !horaInicio || !horaFin || !agendaId) {
        return res.status(400).json({
          success: false,
          message: 'Los campos fecha, horaInicio, horaFin y agendaId son obligatorios'
        });
      }

      // Check for time conflicts
      const existingDay = await AgendaDia.findOne({
        agendaId,
        fecha: new Date(fecha),
        $or: [
          { horaInicio: { $lt: horaFin }, horaFin: { $gt: horaInicio } },
          { horaInicio: { $eq: horaInicio } }
        ]
      });

      if (existingDay) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una entrada en la agenda para este horario'
        });
      }

      const agendaDia = new AgendaDia({
        ...req.body,
        usuarioCreacion: req.user?.id || 'sistema'
      });
      
      await agendaDia.save();

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'AgendaDia',
          idEntidad: agendaDia._id,
          accion: 'CREATE',
          usuarioId: req.user?.id || 'sistema',
          datosNuevos: agendaDia.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedAgendaDia = await AgendaDia.findById(agendaDia._id)
        .populate('agendaId', 'nombre descripcion');

      res.status(201).json({
        success: true,
        message: 'Día de agenda creado exitosamente',
        data: populatedAgendaDia
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear día de agenda',
        error: error.message
      });
    }
  }

  // Update agenda day
  static async update(req, res) {
    try {
      const agendaDiaAnterior = await AgendaDia.findById(req.params.id);
      if (!agendaDiaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Día de agenda no encontrado'
        });
      }

      const agendaDia = await AgendaDia.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('agendaId', 'nombre descripcion');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'AgendaDia',
          idEntidad: agendaDia._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: agendaDiaAnterior.toObject(),
          datosNuevos: agendaDia.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Día de agenda actualizado exitosamente',
        data: agendaDia
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar día de agenda',
        error: error.message
      });
    }
  }

  // Delete agenda day
  static async delete(req, res) {
    try {
      const agendaDia = await AgendaDia.findById(req.params.id);
      if (!agendaDia) {
        return res.status(404).json({
          success: false,
          message: 'Día de agenda no encontrado'
        });
      }

      await AgendaDia.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'AgendaDia',
          idEntidad: req.params.id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: agendaDia.toObject(),
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
        message: 'Día de agenda eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar día de agenda',
        error: error.message
      });
    }
  }
}

module.exports = AgendaDiaController;
