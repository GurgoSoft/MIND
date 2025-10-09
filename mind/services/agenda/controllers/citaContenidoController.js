const mongoose = require('mongoose');
const CitaContenido = require('../../../shared/models/agenda/CitaContenido');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class CitaContenidoController {
  // Get all appointment contents with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.citaId) filter.citaId = req.query.citaId;
      if (req.query.tipo) filter.tipo = req.query.tipo;

            const citaContenidos = await CitaContenido.find(filter)
        .populate('citaId', 'fecha hora')
        
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: citaContenidos,
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
        message: 'Error al obtener contenidos de cita',
        error: error.message
      });
    }
  }

  // Get appointment content by ID
  static async getById(req, res) {
    try {
      const citaContenido = await CitaContenido.findById(req.params.id)
        .populate('citaId', 'fecha hora');

      if (!citaContenido) {
        return res.status(404).json({
          success: false,
          message: 'Contenido de cita no encontrado'
        });
      }

      res.json({
        success: true,
        data: citaContenido
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener contenido de cita',
        error: error.message
      });
    }
  }

  // Get contents by appointment ID
  static async getByCita(req, res) {
    try {
      const citaContenidos = await CitaContenido.find({ citaId: req.params.citaId })
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: citaContenidos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener contenidos de la cita',
        error: error.message
      });
    }
  }

  // Create new appointment content
  static async create(req, res) {
    try {
      // Validate required fields
      const { idCita, notas } = req.body;
      if (!idCita || !notas) {
        return res.status(400).json({
          success: false,
          message: 'IdCita y notas son requeridos'
        });
      }

      // Validate foreign key
      const Cita = require('../../../shared/models/agenda/Cita');
      const citaExists = await Cita.findById(idCita);
      if (!citaExists) {
        return res.status(400).json({
          success: false,
          message: 'La cita especificada no existe'
        });
      }

      // Check for duplicate content
      const existingContent = await CitaContenido.findOne({ idCita });
      if (existingContent) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe contenido para esta cita'
        });
      }

      const citaContenido = new CitaContenido(req.body);
      await citaContenido.save();

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaContenido',
          idEntidad: citaContenido._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: citaContenido.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedCitaContenido = await CitaContenido.findById(citaContenido._id)
        .populate('idCita', 'fechaHora estado');

      res.status(201).json({
        success: true,
        message: 'Contenido de cita creado exitosamente',
        data: populatedCitaContenido
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando contenido de cita',
        error: error.message
      });
    }
  }

  // Update appointment content
  static async update(req, res) {
    try {
      const citaContenidoAnterior = await CitaContenido.findById(req.params.id);
      if (!citaContenidoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Contenido de cita no encontrado'
        });
      }

      // Validate foreign key if changing
      if (req.body.idCita && req.body.idCita !== citaContenidoAnterior.idCita.toString()) {
        const Cita = require('../../../shared/models/agenda/Cita');
        const citaExists = await Cita.findById(req.body.idCita);
        if (!citaExists) {
          return res.status(400).json({
            success: false,
            message: 'La cita especificada no existe'
          });
        }
      }

      const citaContenido = await CitaContenido.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('idCita', 'fechaHora estado');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaContenido',
          idEntidad: citaContenido._id,
          accion: 'UPDATE',
          datosAnteriores: citaContenidoAnterior.toObject(),
          datosNuevos: citaContenido.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Contenido de cita actualizado exitosamente',
        data: citaContenido
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando contenido de cita',
        error: error.message
      });
    }
  }

  // Delete appointment content
  static async delete(req, res) {
    try {
      const citaContenido = await CitaContenido.findById(req.params.id);
      if (!citaContenido) {
        return res.status(404).json({
          success: false,
          message: 'Contenido de cita no encontrado'
        });
      }

      await CitaContenido.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaContenido',
          idEntidad: citaContenido._id,
          accion: 'DELETE',
          datosAnteriores: citaContenido.toObject(),
          datosNuevos: null,
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Contenido de cita eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando contenido de cita',
        error: error.message
      });
    }
  }

}

module.exports = CitaContenidoController;
