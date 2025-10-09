const mongoose = require('mongoose');
const CitaDiagnostico = require('../../../shared/models/agenda/CitaDiagnostico');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class CitaDiagnosticoController {
  // Get all appointment diagnoses with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.citaId) filter.citaId = req.query.citaId;
      if (req.query.tipoDiagnosticoId) filter.tipoDiagnosticoId = req.query.tipoDiagnosticoId;

            const citaDiagnosticos = await CitaDiagnostico.find(filter)
        .populate('citaId', 'fecha hora')
        .populate('tipoDiagnosticoId', 'nombre descripcion')
        
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: citaDiagnosticos,
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
        message: 'Error al obtener diagnósticos de cita',
        error: error.message
      });
    }
  }

  // Get appointment diagnosis by ID
  static async getById(req, res) {
    try {
      const citaDiagnostico = await CitaDiagnostico.findById(req.params.id)
        .populate('citaId', 'fecha hora')
        .populate('tipoDiagnosticoId', 'nombre descripcion');

      if (!citaDiagnostico) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico de cita no encontrado'
        });
      }

      res.json({
        success: true,
        data: citaDiagnostico
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener diagnóstico de cita',
        error: error.message
      });
    }
  }

  // Get diagnoses by appointment ID
  static async getByCita(req, res) {
    try {
      const citaDiagnosticos = await CitaDiagnostico.find({ citaId: req.params.citaId })
        .populate('tipoDiagnosticoId', 'nombre descripcion')
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: citaDiagnosticos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener diagnósticos de la cita',
        error: error.message
      });
    }
  }

  // Create new appointment diagnosis
  static async create(req, res) {
    try {
      // Validate required fields
      const { idCita, idTipoDiagnostico, descripcion } = req.body;
      if (!idCita || !idTipoDiagnostico || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'IdCita, idTipoDiagnostico y descripcion son requeridos'
        });
      }

      // Validate foreign keys
      const Cita = require('../../../shared/models/agenda/Cita');
      const TipoDiagnostico = require('../../../shared/models/agenda/TipoDiagnostico');
      
      const citaExists = await Cita.findById(idCita);
      if (!citaExists) {
        return res.status(400).json({
          success: false,
          message: 'La cita especificada no existe'
        });
      }

      const tipoDiagnosticoExists = await TipoDiagnostico.findById(idTipoDiagnostico);
      if (!tipoDiagnosticoExists) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de diagnóstico especificado no existe'
        });
      }

      // Check for duplicate diagnosis
      const existingDiagnosis = await CitaDiagnostico.findOne({ 
        idCita, 
        idTipoDiagnostico 
      });
      if (existingDiagnosis) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un diagnóstico de este tipo para esta cita'
        });
      }

      const citaDiagnostico = new CitaDiagnostico(req.body);
      await citaDiagnostico.save();

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: citaDiagnostico._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: citaDiagnostico.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedCitaDiagnostico = await CitaDiagnostico.findById(citaDiagnostico._id)
        .populate('idCita', 'fechaHora estado')
        .populate('idTipoDiagnostico', 'nombre descripcion');

      res.status(201).json({
        success: true,
        message: 'Diagnóstico de cita creado exitosamente',
        data: populatedCitaDiagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear diagnóstico de cita',
        error: error.message
      });
    }
  }

  // Update appointment diagnosis
  static async update(req, res) {
    try {
      const citaDiagnosticoAnterior = await CitaDiagnostico.findById(req.params.id);
      if (!citaDiagnosticoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico de cita no encontrado'
        });
      }

      const citaDiagnostico = await CitaDiagnostico.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('citaId', 'fecha hora')
       .populate('tipoDiagnosticoId', 'nombre descripcion');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: citaDiagnostico._id,
          accion: 'UPDATE',
          datosAnteriores: citaDiagnosticoAnterior.toObject(),
          datosNuevos: citaDiagnostico.toObject(),
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
        message: 'Diagnóstico de cita actualizado exitosamente',
        data: citaDiagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando diagnóstico de cita',
        error: error.message
      });
    }
  }

  // Delete appointment diagnosis
  static async delete(req, res) {
    try {
      const citaDiagnostico = await CitaDiagnostico.findById(req.params.id);
      if (!citaDiagnostico) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico de cita no encontrado'
        });
      }

      await CitaDiagnostico.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: citaDiagnostico._id,
          accion: 'DELETE',
          datosAnteriores: citaDiagnostico.toObject(),
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
        message: 'Diagnóstico de cita eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando diagnóstico de cita',
        error: error.message
      });
    }
  }
}

module.exports = CitaDiagnosticoController;
