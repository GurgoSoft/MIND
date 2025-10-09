const mongoose = require('mongoose');
const CitaDiagnostico = require('../../../shared/models/agenda/CitaDiagnostico');
const TipoDiagnostico = require('../../../shared/models/agenda/TipoDiagnostico');
const AgendaAuditoria = require('../../../shared/models/agenda/AgendaAuditoria');

class CitaDiagnosticoController {
  // Get all tipos de diagnostico
  static async getAllTipos(req, res) {
    try {

      const tipos = await TipoDiagnostico.find()
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: tipos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo tipos de diagnóstico',
        error: error.message
      });
    }
  }

  // Get tipo diagnostico by ID
  static async getTipoById(req, res) {
    try {
      const tipo = await TipoDiagnostico.findById(req.params.id);
      
      if (!tipo) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de diagnóstico no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo tipo de diagnóstico',
        error: error.message
      });
    }
  }

  // Create new tipo diagnostico
  static async createTipo(req, res) {
    try {
      const tipo = new TipoDiagnostico(req.body);
      await tipo.save();

      // Audit log (non-critical)
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoDiagnostico',
          idEntidad: tipo._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: tipo.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Tipo de diagnóstico creado exitosamente',
        data: tipo
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando tipo de diagnóstico',
        error: error.message
      });
    }
  }

  // Update tipo diagnostico
  static async updateTipo(req, res) {
    try {
      const tipoAnterior = await TipoDiagnostico.findById(req.params.id);
      
      if (!tipoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de diagnóstico no encontrado'
        });
      }

      const tipo = await TipoDiagnostico.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Audit log (non-critical)
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoDiagnostico',
          idEntidad: tipo._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipoAnterior.toObject(),
          datosNuevos: tipo.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de diagnóstico actualizado exitosamente',
        data: tipo
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando tipo de diagnóstico',
        error: error.message
      });
    }
  }

  // Delete tipo diagnostico
  static async deleteTipo(req, res) {
    try {
      const tipo = await TipoDiagnostico.findById(req.params.id);
      
      if (!tipo) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de diagnóstico no encontrado'
        });
      }

      await TipoDiagnostico.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AgendaAuditoria.create({
          entidad: 'TipoDiagnostico',
          idEntidad: tipo._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipo.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
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

  // Get all diagnosticos for a cita
  static async getDiagnosticosByCita(req, res) {
    try {
      const { idCita } = req.params;

      const diagnosticos = await CitaDiagnostico.find({ idCita })
        .populate('idTipoDiagnostico', 'codigo nombre')
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: diagnosticos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo diagnósticos de la cita',
        error: error.message
      });
    }
  }

  // Create diagnostico for cita
  static async createDiagnostico(req, res) {
    try {
      const { idCita } = req.params;
      const { idTipoDiagnostico, descripcion } = req.body;

      // Validate required fields
      if (!idTipoDiagnostico || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'IdTipoDiagnostico y descripcion son requeridos'
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

      const tipoExists = await TipoDiagnostico.findById(idTipoDiagnostico);
      if (!tipoExists) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de diagnóstico especificado no existe'
        });
      }

      const diagnosticoData = { ...req.body, idCita };
      const diagnostico = new CitaDiagnostico(diagnosticoData);
      await diagnostico.save();

      await diagnostico.populate('idTipoDiagnostico', 'codigo nombre');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: diagnostico._id,
          accion: 'CREATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: null,
          datosNuevos: diagnostico.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Diagnóstico creado exitosamente',
        data: diagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando diagnóstico',
        error: error.message
      });
    }
  }

  // Update diagnostico
  static async updateDiagnostico(req, res) {
    try {
      const diagnosticoAnterior = await CitaDiagnostico.findById(req.params.id);
      
      if (!diagnosticoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico no encontrado'
        });
      }

      // Validate foreign keys if changing
      if (req.body.idTipoDiagnostico) {
        const TipoDiagnostico = require('../../../shared/models/agenda/TipoDiagnostico');
        const tipoExists = await TipoDiagnostico.findById(req.body.idTipoDiagnostico);
        if (!tipoExists) {
          return res.status(400).json({
            success: false,
            message: 'El tipo de diagnóstico especificado no existe'
          });
        }
      }

      const diagnostico = await CitaDiagnostico.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('idTipoDiagnostico', 'codigo nombre');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: diagnostico._id,
          accion: 'UPDATE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: diagnosticoAnterior.toObject(),
          datosNuevos: diagnostico.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Diagnóstico actualizado exitosamente',
        data: diagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando diagnóstico',
        error: error.message
      });
    }
  }

  // Delete diagnostico
  static async deleteDiagnostico(req, res) {
    try {
      const diagnostico = await CitaDiagnostico.findById(req.params.id);
      
      if (!diagnostico) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico no encontrado'
        });
      }

      await CitaDiagnostico.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: diagnostico._id,
          accion: 'DELETE',
          usuarioId: req.userId || req.user?.id || 'sistema',
          datosAnteriores: diagnostico.toObject(),
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
        message: 'Diagnóstico eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando diagnóstico',
        error: error.message
      });
    }
  }

  // Get all cita diagnosticos with pagination
  static async getAll(req, res) {
    try {

      const diagnosticos = await CitaDiagnostico.find()
        .populate('idTipoDiagnostico', 'codigo nombre')
        .populate('idCita', 'fechaCita')
        .sort({ fechaCreacion: -1 })
        ;

            res.json({
        success: true,
        data: diagnosticos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo diagnósticos',
        error: error.message
      });
    }
  }

  // Get diagnostico by ID
  static async getById(req, res) {
    try {
      const diagnostico = await CitaDiagnostico.findById(req.params.id)
        .populate('idTipoDiagnostico', 'codigo nombre')
        .populate('idCita', 'fechaCita');
      
      if (!diagnostico) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico no encontrado'
        });
      }

      res.json({
        success: true,
        data: diagnostico
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo diagnóstico',
        error: error.message
      });
    }
  }

  // Get diagnosticos by cita ID
  static async getByCita(req, res) {
    try {
      const diagnosticos = await CitaDiagnostico.find({ idCita: req.params.citaId })
        .populate('idTipoDiagnostico', 'codigo nombre')
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: diagnosticos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo diagnósticos de la cita',
        error: error.message
      });
    }
  }

  // Create new diagnostico
  static async create(req, res) {
    try {
      const diagnostico = new CitaDiagnostico(req.body);
      await diagnostico.save();

      await diagnostico.populate('idTipoDiagnostico', 'codigo nombre');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: diagnostico._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: diagnostico.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Diagnóstico creado exitosamente',
        data: diagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando diagnóstico',
        error: error.message
      });
    }
  }

  // Update diagnostico
  static async update(req, res) {
    try {
      const diagnosticoAnterior = await CitaDiagnostico.findById(req.params.id);
      
      if (!diagnosticoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico no encontrado'
        });
      }

      const diagnostico = await CitaDiagnostico.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('idTipoDiagnostico', 'codigo nombre');

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: diagnostico._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: diagnosticoAnterior.toObject(),
          datosNuevos: diagnostico.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Diagnóstico actualizado exitosamente',
        data: diagnostico
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando diagnóstico',
        error: error.message
      });
    }
  }

  // Delete diagnostico
  static async delete(req, res) {
    try {
      const diagnostico = await CitaDiagnostico.findById(req.params.id);
      
      if (!diagnostico) {
        return res.status(404).json({
          success: false,
          message: 'Diagnóstico no encontrado'
        });
      }

      await CitaDiagnostico.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AgendaAuditoria.create({
          entidad: 'CitaDiagnostico',
          idEntidad: diagnostico._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: diagnostico.toObject(),
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
        message: 'Diagnóstico eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando diagnóstico',
        error: error.message
      });
    }
  }
}

module.exports = CitaDiagnosticoController;
