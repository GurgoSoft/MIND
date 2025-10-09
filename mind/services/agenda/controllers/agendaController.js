const mongoose = require('mongoose');
const Agenda = require('../../../shared/models/agenda/Agenda');
const AgendaDia = require('../../../shared/models/agenda/AgendaDia');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');
const Persona = require('../../../shared/models/usuarios/Persona');
const Usuario = require('../../../shared/models/usuarios/Usuario');

class AgendaController {
  // Get all agendas with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.idUsuario) {
        filter.idUsuario = req.query.idUsuario;
      }
      if (req.query.idTipoAgenda) {
        filter.idTipoAgenda = req.query.idTipoAgenda;
      }

      const agendas = await Agenda.find(filter)
        .populate([
          { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idTipoAgenda', select: 'codigo nombre' }
        ])
        .sort({ fechaCreacion: -1 })
        ;

            res.json({
        success: true,
        data: agendas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo agendas',
        error: error.message
      });
    }
  }

  // Get agenda by ID
  static async getById(req, res) {
    try {
      const agenda = await Agenda.findById(req.params.id)
        .populate([
          { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idTipoAgenda', select: 'codigo nombre' }
        ]);
      
      if (!agenda) {
        return res.status(404).json({
          success: false,
          message: 'Agenda no encontrada'
        });
      }

      res.json({
        success: true,
        data: agenda
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo agenda',
        error: error.message
      });
    }
  }

  // Create new agenda
  static async create(req, res) {
    try {
      const agenda = new Agenda(req.body);
      await agenda.save();
      
      await agenda.populate([
        { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
        { path: 'idTipoAgenda', select: 'codigo nombre' }
      ]);

      // Audit log (non-critical)
      try {
        await AgendaAuditoria.create({
          entidad: 'Agenda',
          idEntidad: agenda._id,
          accion: 'CREATE',
          usuarioId: req.user?.id || 'sistema',
          datosNuevos: agenda.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Agenda creada exitosamente',
        data: agenda
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando agenda',
        error: error.message
      });
    }
  }

  // Update agenda
  static async update(req, res) {
    try {
      const agendaAnterior = await Agenda.findById(req.params.id);
      
      if (!agendaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Agenda no encontrada'
        });
      }

      const agenda = await Agenda.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
        { path: 'idTipoAgenda', select: 'codigo nombre' }
      ]);

      // Audit log (non-critical)
      try {
        await AgendaAuditoria.create({
          entidad: 'Agenda',
          idEntidad: agenda._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: agendaAnterior.toObject(),
          datosNuevos: agenda.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Agenda actualizada exitosamente',
        data: agenda
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando agenda',
        error: error.message
      });
    }
  }

  // Delete agenda
  static async delete(req, res) {
    try {
      const agenda = await Agenda.findById(req.params.id);
      
      if (!agenda) {
        return res.status(404).json({
          success: false,
          message: 'Agenda no encontrada'
        });
      }

      // Delete related agenda days (non-critical)
      try {
        await AgendaDia.deleteMany({ idAgenda: req.params.id });
      } catch (error) {
        console.error('Error eliminando días de agenda:', error.message);
      }

      await Agenda.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AgendaAuditoria.create({
          entidad: 'Agenda',
          idEntidad: agenda._id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: agenda.toObject(),
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
        message: 'Agenda eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando agenda',
        error: error.message
      });
    }
  }

  // Get agenda days for a specific agenda
  static async getAgendaDays(req, res) {
    try {
      const { idAgenda } = req.params;
      const { fechaInicio, fechaFin } = req.query;

      const filter = { idAgenda };
      if (fechaInicio && fechaFin) {
        filter.fecha = {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        };
      }

      const agendaDias = await AgendaDia.find(filter)
        .populate('idAgenda', 'nombre descripcion')
        .sort({ fecha: 1 });

      res.json({
        success: true,
        data: agendaDias
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo días de agenda',
        error: error.message
      });
    }
  }

  // Create agenda day
  static async createAgendaDay(req, res) {
    try {
      const { idAgenda } = req.params;
      
      // Validate required fields
      const { fecha, horaInicio, horaFin } = req.body;
      if (!fecha || !horaInicio || !horaFin) {
        return res.status(400).json({
          success: false,
          message: 'Los campos fecha, horaInicio y horaFin son obligatorios'
        });
      }

      // Check for time conflicts
      const existingDay = await AgendaDia.findOne({
        idAgenda,
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
        idAgenda,
        usuarioCreacion: req.user?.id || 'sistema'
      });
      
      await agendaDia.save();
      await agendaDia.populate('idAgenda', 'nombre descripcion');

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

      res.status(201).json({
        success: true,
        message: 'Día de agenda creado exitosamente',
        data: agendaDia
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando día de agenda',
        error: error.message
      });
    }
  }

  // Get user agendas
  static async getUserAgendas(req, res) {
    try {
      const { idUsuario } = req.params;

      const agendas = await Agenda.find({ idUsuario })
        .populate('idTipoAgenda', 'codigo nombre')
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: agendas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo agendas del usuario',
        error: error.message
      });
    }
  }

  // Get agendas by type
  static async getByType(req, res) {
    try {
      const { idTipoAgenda } = req.params;

      const agendas = await Agenda.find({ idTipoAgenda })
        .populate([
          { path: 'idUsuario', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idTipoAgenda', select: 'codigo nombre' }
        ])
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: agendas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo agendas por tipo',
        error: error.message
      });
    }
  }
}

module.exports = AgendaController;
