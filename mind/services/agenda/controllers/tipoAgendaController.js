const mongoose = require('mongoose');
const TipoAgenda = require('../../../shared/models/agenda/TipoAgenda');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class TipoAgendaController {
  // Get all agenda types with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.nombre) {
        filter.nombre = { $regex: req.query.nombre, $options: 'i' };
      }
      if (req.query.activo !== undefined) {
        filter.activo = req.query.activo === 'true';
      }

            const tiposAgenda = await TipoAgenda.find(filter)
        
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: tiposAgenda,
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
        message: 'Error al obtener tipos de agenda',
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Get agenda type by ID
  static async getById(req, res) {
    try {
      const tipoAgenda = await TipoAgenda.findById(req.params.id);

      if (!tipoAgenda) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de agenda no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoAgenda
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de agenda',
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Create new agenda type
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, descripcion } = req.body;
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El campo nombre es obligatorio'
        });
      }

      // Check for duplicate name
      const existingTipo = await TipoAgenda.findOne({ nombre });
      if (existingTipo) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un tipo de agenda con este nombre'
        });
      }

      const tipoAgenda = new TipoAgenda({
        ...req.body,
        usuarioCreacion: req.user?.id || 'sistema'
      });
      
      await tipoAgenda.save();

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoAgenda',
          idEntidad: tipoAgenda._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: tipoAgenda.toObject(),
          usuarioId: req.user?.id || 'sistema',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Tipo de agenda creado exitosamente',
        data: tipoAgenda
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear tipo de agenda',
        error: error.message
      });
    }
  }

  // Update agenda type
  static async update(req, res) {
    try {
      const tipoAgendaAnterior = await TipoAgenda.findById(req.params.id);
      if (!tipoAgendaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de agenda no encontrado'
        });
      }

      // Check for duplicate name if name is being updated
      if (req.body.nombre && req.body.nombre !== tipoAgendaAnterior.nombre) {
        const existingTipo = await TipoAgenda.findOne({ nombre: req.body.nombre });
        if (existingTipo) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un tipo de agenda con este nombre'
          });
        }
      }

      const tipoAgenda = await TipoAgenda.findByIdAndUpdate(
        req.params.id,
        { 
          ...req.body,
          usuarioActualizacion: req.user?.id || 'sistema',
          fechaActualizacion: new Date()
        },
        { new: true, runValidators: true }
      );

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoAgenda',
          idEntidad: tipoAgenda._id,
          accion: 'UPDATE',
          datosAnteriores: tipoAgendaAnterior.toObject(),
          datosNuevos: tipoAgenda.toObject(),
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
        message: 'Tipo de agenda actualizado exitosamente',
        data: tipoAgenda
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar tipo de agenda',
        error: error.message
      });
    }
  }

  // Delete agenda type
  static async delete(req, res) {
    try {
      const tipoAgenda = await TipoAgenda.findById(req.params.id);
      if (!tipoAgenda) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de agenda no encontrado'
        });
      }

      // Check if this type is being used by any agenda
      const Agenda = require('../../../shared/models/agenda/Agenda');
      const agendaExists = await Agenda.exists({ idTipoAgenda: req.params.id });
      
      if (agendaExists) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el tipo de agenda porque está siendo utilizado por una o más agendas'
        });
      }

      await TipoAgenda.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoAgenda',
          idEntidad: req.params.id,
          accion: 'DELETE',
          datosAnteriores: tipoAgenda.toObject(),
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
        message: 'Tipo de agenda eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de agenda',
        error: error.message
      });
    }
  }
}

module.exports = TipoAgendaController;
