const mongoose = require('mongoose');
const Cita = require('../../../shared/models/agenda/Cita');
const RegistroCita = require('../../../shared/models/agenda/RegistroCita');
const CitaContenido = require('../../../shared/models/agenda/CitaContenido');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');
const Persona = require('../../../shared/models/usuarios/Persona');
const Usuario = require('../../../shared/models/usuarios/Usuario');

class CitaController {
  // Get all citas with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.idAgenda) {
        filter.idAgenda = req.query.idAgenda;
      }
      if (req.query.idUsuarioEspecialista) {
        filter.idUsuarioEspecialista = req.query.idUsuarioEspecialista;
      }
      if (req.query.idUsuarioPaciente) {
        filter.idUsuarioPaciente = req.query.idUsuarioPaciente;
      }
      if (req.query.estado) {
        filter.estado = req.query.estado;
      }
      if (req.query.fechaInicio && req.query.fechaFin) {
        filter.fechaHoraInicio = {
          $gte: new Date(req.query.fechaInicio),
          $lte: new Date(req.query.fechaFin)
        };
      }

      const citas = await Cita.find(filter)
        .populate([
          { path: 'idAgenda', select: 'nombre descripcion' },
          { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
        ])
        .sort({ fechaHoraInicio: 1 })
        ;

            res.json({
        success: true,
        data: citas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo citas',
        error: error.message
      });
    }
  }

  // Get cita by ID with full details
  static async getById(req, res) {
    try {
      const cita = await Cita.findById(req.params.id)
        .populate([
          { path: 'idAgenda', select: 'nombre descripcion' },
          { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
        ]);
      
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      // Get related content and records
      const [contenido, registros] = await Promise.all([
        CitaContenido.findOne({ idCita: cita._id }),
        RegistroCita.find({ idCita: cita._id }).sort({ fechaHora: -1 })
      ]);

      res.json({
        success: true,
        data: {
          cita,
          contenido,
          registros
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo cita',
        error: error.message
      });
    }
  }

  // Create new cita
  static async create(req, res) {
    try {
      // Validate required fields
      const { fechaHora, idAgenda, idUsuarioEspecialista, idUsuarioPaciente } = req.body;
      if (!fechaHora || !idAgenda || !idUsuarioEspecialista || !idUsuarioPaciente) {
        return res.status(400).json({
          success: false,
          message: 'FechaHora, idAgenda, idUsuarioEspecialista e idUsuarioPaciente son requeridos'
        });
      }

      // Validate foreign keys
      const Agenda = require('../../../shared/models/agenda/Agenda');
      const Usuario = require('../../../shared/models/usuarios/Usuario');
      
      const agendaExists = await Agenda.findById(idAgenda);
      if (!agendaExists) {
        return res.status(400).json({
          success: false,
          message: 'La agenda especificada no existe'
        });
      }

      const especialistaExists = await Usuario.findById(idUsuarioEspecialista);
      if (!especialistaExists) {
        return res.status(400).json({
          success: false,
          message: 'El especialista especificado no existe'
        });
      }

      const pacienteExists = await Usuario.findById(idUsuarioPaciente);
      if (!pacienteExists) {
        return res.status(400).json({
          success: false,
          message: 'El paciente especificado no existe'
        });
      }

      // Check for scheduling conflicts
      const conflictingCita = await Cita.findOne({
        idUsuarioEspecialista,
        fechaHora: new Date(fechaHora),
        estado: { $ne: 'cancelada' }
      });
      if (conflictingCita) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una cita programada para el especialista en esa fecha y hora'
        });
      }

      const cita = new Cita(req.body);
      await cita.save();
      
      await cita.populate([
        { path: 'idAgenda', select: 'nombre descripcion' },
        { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
        { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
      ]);

      // Create initial record
      await RegistroCita.create({
        idCita: cita._id,
        evento: 'creada',
        descripcion: 'Cita creada en el sistema'
      });

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'Cita',
          idEntidad: cita._id,
          accion: 'CREATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosNuevos: cita.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: cita
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando cita',
        error: error.message
      });
    }
  }

  // Update cita
  static async update(req, res) {
    try {
      const citaAnterior = await Cita.findById(req.params.id);
      
      if (!citaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      // Validate foreign keys if changing
      if (req.body.idAgenda || req.body.idUsuarioEspecialista || req.body.idUsuarioPaciente) {
        const Agenda = require('../../../shared/models/agenda/Agenda');
        const Usuario = require('../../../shared/models/usuarios/Usuario');
        
        if (req.body.idAgenda && req.body.idAgenda !== citaAnterior.idAgenda.toString()) {
          const agendaExists = await Agenda.findById(req.body.idAgenda);
          if (!agendaExists) {
            return res.status(400).json({
              success: false,
              message: 'La agenda especificada no existe'
            });
          }
        }

        if (req.body.idUsuarioEspecialista && req.body.idUsuarioEspecialista !== citaAnterior.idUsuarioEspecialista.toString()) {
          const especialistaExists = await Usuario.findById(req.body.idUsuarioEspecialista);
          if (!especialistaExists) {
            return res.status(400).json({
              success: false,
              message: 'El especialista especificado no existe'
            });
          }
        }

        if (req.body.idUsuarioPaciente && req.body.idUsuarioPaciente !== citaAnterior.idUsuarioPaciente.toString()) {
          const pacienteExists = await Usuario.findById(req.body.idUsuarioPaciente);
          if (!pacienteExists) {
            return res.status(400).json({
              success: false,
              message: 'El paciente especificado no existe'
            });
          }
        }
      }

      const cita = await Cita.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: 'idAgenda', select: 'nombre descripcion' },
        { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
        { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
      ]);

      // Create update record
      await RegistroCita.create({
        idCita: cita._id,
        evento: 'actualizada',
        descripcion: 'Cita actualizada'
      });

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'Cita',
          idEntidad: cita._id,
          accion: 'UPDATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: citaAnterior.toObject(),
          datosNuevos: cita.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Cita actualizada exitosamente',
        data: cita
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando cita',
        error: error.message
      });
    }
  }

  // Cancel cita
  static async cancel(req, res) {
    try {
      const cita = await Cita.findById(req.params.id);
      
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      if (cita.estado === 'cancelada') {
        return res.status(400).json({
          success: false,
          message: 'La cita ya está cancelada'
        });
      }

      const citaAnterior = { ...cita.toObject() };
      cita.estado = 'cancelada';
      await cita.save();

      // Create cancellation record
      await RegistroCita.create({
        idCita: cita._id,
        evento: 'cancelada',
        descripcion: req.body.motivo || 'Cita cancelada'
      });

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'Cita',
          idEntidad: cita._id,
          accion: 'UPDATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: citaAnterior,
          datosNuevos: cita.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Cita cancelada exitosamente',
        data: cita
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error cancelando cita',
        error: error.message
      });
    }
  }

  // Complete cita
  static async complete(req, res) {
    try {
      const cita = await Cita.findById(req.params.id);
      
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      if (cita.estado === 'completada') {
        return res.status(400).json({
          success: false,
          message: 'La cita ya está completada'
        });
      }

      const citaAnterior = { ...cita.toObject() };
      cita.estado = 'completada';
      await cita.save();

      // Create completion record
      await RegistroCita.create({
        idCita: cita._id,
        evento: 'completada',
        descripcion: 'Cita completada exitosamente'
      });

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'Cita',
          idEntidad: cita._id,
          accion: 'UPDATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: citaAnterior,
          datosNuevos: cita.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Cita completada exitosamente',
        data: cita
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error completando cita',
        error: error.message
      });
    }
  }

  // Add content to cita
  static async addContent(req, res) {
    try {
      const { id } = req.params;
      const { notas } = req.body;

      if (!notas) {
        return res.status(400).json({
          success: false,
          message: 'Las notas son requeridas'
        });
      }

      const cita = await Cita.findById(id);
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      // Check if content already exists
      let contenido = await CitaContenido.findOne({ idCita: id });

      if (contenido) {
        // Update existing content
        const contenidoAnterior = { ...contenido.toObject() };
        contenido.notas = notas;
        await contenido.save();

        // Non-critical audit log
        try {
          await AgendaAuditoria.create({
            entidad: 'CitaContenido',
            idEntidad: contenido._id,
            accion: 'UPDATE',
            usuarioId: req.userId || req.user?.id || 'sistema',
            datosAnteriores: contenidoAnterior,
            datosNuevos: contenido.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            fecha: new Date()
          });
        } catch (auditError) {
          console.warn('Error en audit log:', auditError.message);
        }
      } else {
        // Create new content
        contenido = new CitaContenido({
          idCita: id,
          notas
        });
        await contenido.save();

        // Non-critical audit log
        try {
          await AgendaAuditoria.create({
            entidad: 'CitaContenido',
            idEntidad: contenido._id,
            accion: 'CREATE',
            usuarioId: req.userId || req.user?.id || 'sistema',
            datosNuevos: contenido.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            fecha: new Date()
          });
        } catch (auditError) {
          console.warn('Error en audit log:', auditError.message);
        }
      }

      res.json({
        success: true,
        message: 'Contenido agregado exitosamente',
        data: contenido
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error agregando contenido',
        error: error.message
      });
    }
  }

  // Get user appointments (as patient or specialist)
  static async getUserAppointments(req, res) {
    try {
      const { idUsuario } = req.params;
      const { rol = 'paciente' } = req.query;

      const filter = rol === 'especialista' 
        ? { idUsuarioEspecialista: idUsuario }
        : { idUsuarioPaciente: idUsuario };

      const citas = await Cita.find(filter)
        .populate([
          { path: 'idAgenda', select: 'nombre descripcion' },
          { path: 'idUsuarioEspecialista', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } },
          { path: 'idUsuarioPaciente', select: 'email', populate: { path: 'idPersona', select: 'nombres apellidos' } }
        ])
        .sort({ fechaHoraInicio: 1 });

      res.json({
        success: true,
        data: citas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo citas del usuario',
        error: error.message
      });
    }
  }
}

module.exports = CitaController;
