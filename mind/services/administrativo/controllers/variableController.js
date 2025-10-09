const mongoose = require('mongoose');
const Variable = require('../../../shared/models/administrativo/Variable');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class VariableController {
  // Get all variables with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.ambiente) {
        filter.ambiente = req.query.ambiente;
      }

      const variables = await Variable.find(filter)
        .populate('idTipoVariable', 'codigo nombre')
        .sort({ clave: 1 })
        ;

            res.json({
        success: true,
        data: variables
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo variables',
        error: error.message
      });
    }
  }

  // Get variable by ID
  static async getById(req, res) {
    try {
      const variable = await Variable.findById(req.params.id)
        .populate('idTipoVariable', 'codigo nombre');
      
      if (!variable) {
        return res.status(404).json({
          success: false,
          message: 'Variable no encontrada'
        });
      }

      res.json({
        success: true,
        data: variable
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo variable',
        error: error.message
      });
    }
  }

  // Create new variable
  static async create(req, res) {
    try {
      const variable = new Variable(req.body);
      await variable.save();
      
      await variable.populate('idTipoVariable', 'codigo nombre');

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Variable',
          idEntidad: variable._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: variable.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Variable creada exitosamente',
        data: variable
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando variable',
        error: error.message
      });
    }
  }

  // Update variable
  static async update(req, res) {
    try {
      const variableAnterior = await Variable.findById(req.params.id);
      
      if (!variableAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Variable no encontrada'
        });
      }

      const variable = await Variable.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('idTipoVariable', 'codigo nombre');

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Variable',
          idEntidad: variable._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: variableAnterior.toObject(),
          datosNuevos: variable.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Variable actualizada exitosamente',
        data: variable
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando variable',
        error: error.message
      });
    }
  }

  // Delete variable
  static async delete(req, res) {
    try {
      const variable = await Variable.findById(req.params.id);
      
      if (!variable) {
        return res.status(404).json({
          success: false,
          message: 'Variable no encontrada'
        });
      }

      await Variable.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Variable',
          idEntidad: variable._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: variable.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Variable eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando variable',
        error: error.message
      });
    }
  }

  // Get variables by environment
  static async getByEnvironment(req, res) {
    try {
      const { ambiente } = req.params;

      const variables = await Variable.find({ ambiente })
        .populate('idTipoVariable', 'codigo nombre')
        .sort({ clave: 1 });

      res.json({
        success: true,
        data: variables
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo variables por ambiente',
        error: error.message
      });
    }
  }
}

module.exports = VariableController;
