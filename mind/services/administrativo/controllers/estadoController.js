const mongoose = require('mongoose');
const Estado = require('../../../shared/models/administrativo/Estado');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class EstadoController {
  // Get all estados with pagination
  static async getAll(req, res) {
    try {
      const filter = {};
      const { nombre, simbolo, modulo, visible } = req.query || {};
      if (nombre) filter.nombre = { $regex: nombre, $options: 'i' };
      if (simbolo) filter.simbolo = { $regex: simbolo, $options: 'i' };
      if (modulo) filter.modulo = { $regex: modulo, $options: 'i' };
      if (typeof visible !== 'undefined') filter.visible = visible === 'true';

      const estados = await Estado.find(filter)
        .sort({ nombre: 1 });

            res.json({
        success: true,
        data: estados
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estados',
        error: error.message
      });
    }
  }

  // Get estado by ID
  static async getById(req, res) {
    try {
      const estado = await Estado.findById(req.params.id);
      
      if (!estado) {
        return res.status(404).json({
          success: false,
          message: 'Estado no encontrado'
        });
      }

      res.json({
        success: true,
        data: estado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado',
        error: error.message
      });
    }
  }

  // Create new estado
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, codigo } = req.body;
      
      if (!nombre || !codigo) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y código son requeridos'
        });
      }

      // Check for duplicate code
      const existingEstado = await Estado.findOne({ codigo });
      if (existingEstado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un estado con este código'
        });
      }

      // Create estado
      const estado = new Estado(req.body);
      const savedEstado = await estado.save();

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Estado',
          idEntidad: savedEstado._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedEstado.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Estado creado exitosamente',
        data: savedEstado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando estado',
        error: error.message
      });
    }
  }

  // Update estado
  static async update(req, res) {
    try {
      const estadoAnterior = await Estado.findById(req.params.id);
      
      if (!estadoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Estado no encontrado'
        });
      }

      const estado = await Estado.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Estado',
          idEntidad: estado._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: estadoAnterior.toObject(),
          datosNuevos: estado.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: estado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando estado',
        error: error.message
      });
    }
  }

  // Delete estado
  static async delete(req, res) {
    try {
      const estado = await Estado.findById(req.params.id);
      
      if (!estado) {
        return res.status(404).json({
          success: false,
          message: 'Estado no encontrado'
        });
      }

      await Estado.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Estado',
          idEntidad: estado._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: estado.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Estado eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando estado',
        error: error.message
      });
    }
  }
}

module.exports = EstadoController;
