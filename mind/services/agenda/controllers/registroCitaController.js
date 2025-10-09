const mongoose = require('mongoose');
const RegistroCita = require('../../../shared/models/agenda/RegistroCita');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class RegistroCitaController {
  // Get all appointment records with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.citaId) filter.citaId = req.query.citaId;
      if (req.query.usuarioId) filter.usuarioId = req.query.usuarioId;
      if (req.query.accion) filter.accion = req.query.accion;
      if (req.query.fechaDesde || req.query.fechaHasta) {
        filter.fechaRegistro = {};
        if (req.query.fechaDesde) filter.fechaRegistro.$gte = new Date(req.query.fechaDesde);
        if (req.query.fechaHasta) filter.fechaRegistro.$lte = new Date(req.query.fechaHasta);
      }

            const registrosCita = await RegistroCita.find(filter)
        .populate('citaId', 'fecha hora estado')
        .populate('usuarioId', 'nombre email')
        
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: registrosCita,
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
        message: 'Error al obtener registros de cita',
        error: error.message
      });
    }
  }

  // Get appointment record by ID
  static async getById(req, res) {
    try {
      const registroCita = await RegistroCita.findById(req.params.id)
        .populate('citaId', 'fecha hora estado')
        .populate('usuarioId', 'nombre email');

      if (!registroCita) {
        return res.status(404).json({
          success: false,
          message: 'Registro de cita no encontrado'
        });
      }

      res.json({
        success: true,
        data: registroCita
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registro de cita',
        error: error.message
      });
    }
  }

  // Get records by appointment ID
  static async getByCita(req, res) {
    try {
      const registrosCita = await RegistroCita.find({ citaId: req.params.citaId })
        .populate('usuarioId', 'nombre email')
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: registrosCita
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registros de la cita',
        error: error.message
      });
    }
  }

  // Get records by user ID
  static async getByUsuario(req, res) {
    try {
      const registrosCita = await RegistroCita.find({ usuarioId: req.params.usuarioId })
        .populate('citaId', 'fecha hora estado')
        .sort({ fechaRegistro: -1 });

      res.json({
        success: true,
        data: registrosCita
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registros del usuario',
        error: error.message
      });
    }
  }

  // Create new appointment record
  static async create(req, res) {
    try {
      // Validate required fields
      const { citaId, accion, descripcion } = req.body;
      if (!citaId || !accion || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'citaId, accion y descripcion son campos requeridos'
        });
      }

      // Validate foreign key
      const Cita = require('../../../shared/models/agenda/Cita');
      const citaExists = await Cita.findById(citaId);
      if (!citaExists) {
        return res.status(400).json({
          success: false,
          message: 'La cita especificada no existe'
        });
      }

      const registroCita = new RegistroCita({
        ...req.body,
        usuarioId: req.user?.id || 'sistema'
      });
      
      await registroCita.save();

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'RegistroCita',
          idEntidad: registroCita._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: registroCita.toObject(),
          usuarioId: req.user?.id || 'sistema',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedRegistroCita = await RegistroCita.findById(registroCita._id)
        .populate('citaId', 'fechaHora estado')
        .populate('usuarioId', 'nombre email');

      res.status(201).json({
        success: true,
        message: 'Registro de cita creado exitosamente',
        data: populatedRegistroCita
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear registro de cita',
        error: error.message
      });
    }
  }

  // Update appointment record
  static async update(req, res) {
    try {
      const registroCitaAnterior = await RegistroCita.findById(req.params.id);
      if (!registroCitaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Registro de cita no encontrado'
        });
      }

      // Validate foreign key if changing
      if (req.body.citaId) {
        const Cita = require('../../../shared/models/agenda/Cita');
        const citaExists = await Cita.findById(req.body.citaId);
        if (!citaExists) {
          return res.status(400).json({
            success: false,
            message: 'La cita especificada no existe'
          });
        }
      }

      const registroCita = await RegistroCita.findByIdAndUpdate(
        req.params.id,
        { 
          ...req.body,
          usuarioId: req.user?.id || 'sistema' // Update the user who made the change
        },
        { new: true, runValidators: true }
      ).populate('citaId', 'fechaHora estado')
       .populate('usuarioId', 'nombre email');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'RegistroCita',
          idEntidad: registroCita._id,
          accion: 'UPDATE',
          datosAnteriores: registroCitaAnterior.toObject(),
          datosNuevos: registroCita.toObject(),
          usuarioId: req.user?.id || 'sistema',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Registro de cita actualizado exitosamente',
        data: registroCita
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar registro de cita',
        error: error.message
      });
    }
  }

  // Delete appointment record
  static async delete(req, res) {
    try {
      const registroCita = await RegistroCita.findById(req.params.id);
      if (!registroCita) {
        return res.status(404).json({
          success: false,
          message: 'Registro de cita no encontrado'
        });
      }

      await RegistroCita.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'RegistroCita',
          idEntidad: registroCita._id,
          accion: 'DELETE',
          datosAnteriores: registroCita.toObject(),
          datosNuevos: null,
          usuarioId: req.user?.id || 'sistema',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Registro de cita eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar registro de cita',
        error: error.message
      });
    }
  }

}

module.exports = RegistroCitaController;
