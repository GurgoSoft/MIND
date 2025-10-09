const mongoose = require('mongoose');
const SeguimientoPaciente = require('../../../shared/models/agenda/SeguimientoPaciente');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');
const Persona = require('../../../shared/models/usuarios/Persona');
const Usuario = require('../../../shared/models/usuarios/Usuario');

class SeguimientoPacienteController {
  // Get all seguimientos with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.idCita) {
        filter.idCita = req.query.idCita;
      }
      if (req.query.idUsuarioPaciente) {
        filter.idUsuarioPaciente = req.query.idUsuarioPaciente;
      }

      const seguimientos = await SeguimientoPaciente.find(filter)
        .populate([
          { 
            path: 'idCita', 
            select: 'fechaHoraInicio fechaHoraFin estado',
            populate: [
              { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
            ]
          },
          { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
        ])
        .sort({ fechaCreacion: -1 })
        ;

            res.json({
        success: true,
        data: seguimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo seguimientos',
        error: error.message
      });
    }
  }

  // Get seguimiento by ID
  static async getById(req, res) {
    try {
      const seguimiento = await SeguimientoPaciente.findById(req.params.id)
        .populate([
          { 
            path: 'idCita', 
            select: 'fechaHoraInicio fechaHoraFin estado modalidad',
            populate: [
              { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
              { path: 'idAgenda', select: 'nombre descripcion' }
            ]
          },
          { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
        ]);
      
      if (!seguimiento) {
        return res.status(404).json({
          success: false,
          message: 'Seguimiento no encontrado'
        });
      }

      res.json({
        success: true,
        data: seguimiento
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo seguimiento',
        error: error.message
      });
    }
  }

  // Create new seguimiento
  static async create(req, res) {
    try {
      // Validate required fields
      const { idCita, idUsuarioPaciente, observaciones } = req.body;
      if (!idCita || !idUsuarioPaciente || !observaciones) {
        return res.status(400).json({
          success: false,
          message: 'idCita, idUsuarioPaciente y observaciones son campos requeridos'
        });
      }

      // Validate foreign keys
      const Cita = require('../../../shared/models/agenda/Cita');
      const citaExists = await Cita.findById(idCita);
      if (!citaExists) {
        return res.status(400).json({
          success: false,
          message: 'La cita especificada no existe'
        });
      }

      const usuarioExists = await Usuario.findById(idUsuarioPaciente);
      if (!usuarioExists) {
        return res.status(400).json({
          success: false,
          message: 'El usuario paciente especificado no existe'
        });
      }

      const seguimiento = new SeguimientoPaciente({
        ...req.body,
        idUsuarioRegistro: req.userId || 'sistema'
      });
      
      await seguimiento.save();
      
      await seguimiento.populate([
        { 
          path: 'idCita', 
          select: 'fechaHoraInicio fechaHoraFin estado',
          populate: [
            { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
          ]
        },
        { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
      ]);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'SeguimientoPaciente',
          idEntidad: seguimiento._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: null,
          datosNuevos: seguimiento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Seguimiento creado exitosamente',
        data: seguimiento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando seguimiento',
        error: error.message
      });
    }
  }

  // Update seguimiento
  static async update(req, res) {
    try {
      const seguimientoAnterior = await SeguimientoPaciente.findById(req.params.id);
      
      if (!seguimientoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Seguimiento no encontrado'
        });
      }

      // Validate foreign keys if changing
      if (req.body.idCita) {
        const Cita = require('../../../shared/models/agenda/Cita');
        const citaExists = await Cita.findById(req.body.idCita);
        if (!citaExists) {
          return res.status(400).json({
            success: false,
            message: 'La cita especificada no existe'
          });
        }
      }

      if (req.body.idUsuarioPaciente) {
        const usuarioExists = await Usuario.findById(req.body.idUsuarioPaciente);
        if (!usuarioExists) {
          return res.status(400).json({
            success: false,
            message: 'El usuario paciente especificado no existe'
          });
        }
      }

      const seguimiento = await SeguimientoPaciente.findByIdAndUpdate(
        req.params.id,
        { 
          ...req.body,
          idUsuarioActualizacion: req.userId || 'sistema',
          fechaActualizacion: new Date()
        },
        { new: true, runValidators: true }
      ).populate([
        { 
          path: 'idCita', 
          select: 'fechaHoraInicio fechaHoraFin estado',
          populate: [
            { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
          ]
        },
        { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
      ]);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'SeguimientoPaciente',
          idEntidad: seguimiento._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: seguimientoAnterior.toObject(),
          datosNuevos: seguimiento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Seguimiento actualizado exitosamente',
        data: seguimiento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando seguimiento',
        error: error.message
      });
    }
  }

  // Delete seguimiento
  static async delete(req, res) {
    try {
      const seguimiento = await SeguimientoPaciente.findById(req.params.id);
      
      if (!seguimiento) {
        return res.status(404).json({
          success: false,
          message: 'Seguimiento no encontrado'
        });
      }

      await SeguimientoPaciente.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'SeguimientoPaciente',
          idEntidad: seguimiento._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: seguimiento.toObject(),
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
        message: 'Seguimiento eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando seguimiento',
        error: error.message
      });
    }
  }

  // Get seguimientos by patient
  static async getByPatient(req, res) {
    try {
      const { idUsuarioPaciente } = req.params;

      const seguimientos = await SeguimientoPaciente.find({ idUsuarioPaciente })
        .populate([
          { 
            path: 'idCita', 
            select: 'fechaHoraInicio fechaHoraFin estado modalidad',
            populate: [
              { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
              { path: 'idAgenda', select: 'nombre descripcion' }
            ]
          }
        ])
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: seguimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo seguimientos del paciente',
        error: error.message
      });
    }
  }

  // Get seguimientos by cita
  static async getByCita(req, res) {
    try {
      const { idCita } = req.params;

      const seguimientos = await SeguimientoPaciente.find({ idCita })
        .populate('idUsuarioPaciente', 'email')
        .populate({
          path: 'idUsuarioPaciente',
          populate: { path: 'idPersona', select: 'nombres apellidos' }
        })
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: seguimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo seguimientos de la cita',
        error: error.message
      });
    }
  }

  // Get pending follow-ups
  static async getPendingFollowUps(req, res) {
    try {
      const today = new Date();
      
      const seguimientos = await SeguimientoPaciente.find({
        fechaProximaRevision: { $lte: today }
      })
      .populate([
        { 
          path: 'idCita', 
          select: 'fechaHoraInicio fechaHoraFin estado',
          populate: [
            { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
          ]
        },
        { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
      ])
      .sort({ fechaProximaRevision: 1 });

      res.json({
        success: true,
        data: seguimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo seguimientos pendientes',
        error: error.message
      });
    }
  }
}

module.exports = SeguimientoPacienteController;
