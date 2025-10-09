const mongoose = require('mongoose');
const Departamento = require('../../../shared/models/administrativo/Departamento');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class DepartamentoController {
  // Get all departamentos with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.idPais) {
        filter.idPais = req.query.idPais;
      }

      const departamentos = await Departamento.find(filter)
        .populate('idPais', 'nombre codigoISO')
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: departamentos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo departamentos',
        error: error.message
      });
    }
  }

  // Get departamento by ID
  static async getById(req, res) {
    try {
      const departamento = await Departamento.findById(req.params.id)
        .populate('idPais', 'nombre codigoISO');
      
      if (!departamento) {
        return res.status(404).json({
          success: false,
          message: 'Departamento no encontrado'
        });
      }

      res.json({
        success: true,
        data: departamento
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo departamento',
        error: error.message
      });
    }
  }

  // Create new departamento
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, codigoDANE, idPais } = req.body;
      
      if (!nombre || !codigoDANE || !idPais) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, código DANE y país son requeridos'
        });
      }

      // Check for duplicate code
      const existingDepartamento = await Departamento.findOne({ codigoDANE });
      if (existingDepartamento) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un departamento con este código'
        });
      }

      // Validate country exists
      const Pais = require('../../../shared/models/administrativo/Pais');
      const paisExists = await Pais.findById(idPais);
      if (!paisExists) {
        return res.status(400).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      // Create departamento
      const departamento = new Departamento(req.body);
      const savedDepartamento = await departamento.save();
      
      await savedDepartamento.populate('idPais', 'nombre codigoISO');

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Departamento',
          idEntidad: savedDepartamento._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedDepartamento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Departamento creado exitosamente',
        data: savedDepartamento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando departamento',
        error: error.message
      });
    }
  }

  // Update departamento
  static async update(req, res) {
    try {
      const departamentoAnterior = await Departamento.findById(req.params.id);
      
      if (!departamentoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Departamento no encontrado'
        });
      }

      const departamento = await Departamento.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('idPais', 'nombre codigoISO');

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Departamento',
          idEntidad: departamento._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: departamentoAnterior.toObject(),
          datosNuevos: departamento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Departamento actualizado exitosamente',
        data: departamento
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando departamento',
        error: error.message
      });
    }
  }

  // Delete departamento
  static async delete(req, res) {
    try {
      const departamento = await Departamento.findById(req.params.id);
      
      if (!departamento) {
        return res.status(404).json({
          success: false,
          message: 'Departamento no encontrado'
        });
      }

      await Departamento.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Departamento',
          idEntidad: departamento._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: departamento.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Departamento eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando departamento',
        error: error.message
      });
    }
  }
}

module.exports = DepartamentoController;
