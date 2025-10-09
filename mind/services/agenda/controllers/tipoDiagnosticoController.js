const mongoose = require('mongoose');
const TipoDiagnostico = require('../../../shared/models/agenda/TipoDiagnostico');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class TipoDiagnosticoController {
  // Get all diagnosis types with pagination and filtering
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

            const tiposDiagnostico = await TipoDiagnostico.find(filter)
        
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: tiposDiagnostico,
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
        message: 'Error al obtener tipos de diagnóstico',
        error: error.message
      });
    }
  }

  // Get diagnosis type by ID
  static async getById(req, res) {
    try {
      const tipoDiagnostico = await TipoDiagnostico.findById(req.params.id);

      if (!tipoDiagnostico) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de diagnóstico no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoDiagnostico
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de diagnóstico',
        error: error.message
      });
    }
  }

  // Create new diagnosis type
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
      const existingTipo = await TipoDiagnostico.findOne({ nombre });
      if (existingTipo) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un tipo de diagnóstico con este nombre'
        });
      }

      const tipoDiagnostico = new TipoDiagnostico({
        ...req.body,
        usuarioCreacion: req.user?.id || 'sistema'
      });
      
      await tipoDiagnostico.save();

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoDiagnostico',
          idEntidad: tipoDiagnostico._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: tipoDiagnostico.toObject(),
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
        message: 'Tipo de diagnóstico creado exitosamente',
        data: tipoDiagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando tipo de diagnóstico',
        error: error.message
      });
    }
  }

  // Update diagnosis type
  static async update(req, res) {
    try {
      const tipoDiagnosticoAnterior = await TipoDiagnostico.findById(req.params.id);
      if (!tipoDiagnosticoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de diagnóstico no encontrado'
        });
      }

      // Check for duplicate name if name is being updated
      if (req.body.nombre && req.body.nombre !== tipoDiagnosticoAnterior.nombre) {
        const existingTipo = await TipoDiagnostico.findOne({ nombre: req.body.nombre });
        if (existingTipo) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un tipo de diagnóstico con este nombre'
          });
        }
      }

      const tipoDiagnostico = await TipoDiagnostico.findByIdAndUpdate(
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
          entidad: 'TipoDiagnostico',
          idEntidad: tipoDiagnostico._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: tipoDiagnosticoAnterior.toObject(),
          datosNuevos: tipoDiagnostico.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de diagnóstico actualizado exitosamente',
        data: tipoDiagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando tipo de diagnóstico',
        error: error.message
      });
    }
  }

  // Delete diagnosis type
  static async delete(req, res) {
    try {
      const tipoDiagnostico = await TipoDiagnostico.findById(req.params.id);
      if (!tipoDiagnostico) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de diagnóstico no encontrado'
        });
      }

      // Check if this type is being used by any diagnosis
      const Diagnostico = require('../../../shared/models/agenda/Diagnostico');
      const diagnosticoExists = await Diagnostico.exists({ idTipoDiagnostico: req.params.id });
      
      if (diagnosticoExists) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el tipo de diagnóstico porque está siendo utilizado por uno o más diagnósticos'
        });
      }

      await TipoDiagnostico.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoDiagnostico',
          idEntidad: tipoDiagnostico._id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: tipoDiagnostico.toObject(),
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
        message: 'Tipo de diagnóstico eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando tipo de diagnóstico',
        error: error.message
      });
    }
  }
}

module.exports = TipoDiagnosticoController;
