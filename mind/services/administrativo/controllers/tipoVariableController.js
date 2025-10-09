const mongoose = require('mongoose');
const TipoVariable = require('../../../shared/models/administrativo/TipoVariable');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class TipoVariableController {
  // Get all variable types with pagination and filtering
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

            const tiposVariable = await TipoVariable.find(filter)
        
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: tiposVariable
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de variable',
        error: error.message
      });
    }
  }

  // Get variable type by ID
  static async getById(req, res) {
    try {
      const tipoVariable = await TipoVariable.findById(req.params.id);

      if (!tipoVariable) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de variable no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoVariable
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de variable',
        error: error.message
      });
    }
  }

  // Create new variable type
  static async create(req, res) {
    try {
      const tipoVariable = new TipoVariable(req.body);
      await tipoVariable.save();

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoVariable',
          idEntidad: tipoVariable._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: tipoVariable.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Tipo de variable creado exitosamente',
        data: tipoVariable
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear tipo de variable',
        error: error.message
      });
    }
  }

  // Update variable type
  static async update(req, res) {
    try {
      const tipoVariableAnterior = await TipoVariable.findById(req.params.id);
      if (!tipoVariableAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de variable no encontrado'
        });
      }

      const tipoVariable = await TipoVariable.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoVariable',
          idEntidad: tipoVariable._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipoVariableAnterior.toObject(),
          datosNuevos: tipoVariable.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de variable actualizado exitosamente',
        data: tipoVariable
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar tipo de variable',
        error: error.message
      });
    }
  }

  // Delete variable type
  static async delete(req, res) {
    try {
      const tipoVariable = await TipoVariable.findById(req.params.id);
      if (!tipoVariable) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de variable no encontrado'
        });
      }

      await TipoVariable.findByIdAndDelete(req.params.id);

      // Create audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'TipoVariable',
          idEntidad: tipoVariable._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: tipoVariable.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de variable eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de variable',
        error: error.message
      });
    }
  }
}

module.exports = TipoVariableController;
