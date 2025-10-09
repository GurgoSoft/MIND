const mongoose = require('mongoose');
const TipoUsuario = require('../../../shared/models/usuarios/TipoUsuario');
const UsuarioAuditoria = require('../../../shared/models/usuarios/UsuarioAuditoria');

class TipoUsuarioController {
  // Get all tipos usuario
  static async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.codigo) {
        filter.codigo = { $regex: req.query.codigo, $options: 'i' };
      }
      if (req.query.nombre) {
        filter.nombre = { $regex: req.query.nombre, $options: 'i' };
      }

      const tiposUsuario = await TipoUsuario.find(filter)
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: tiposUsuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo tipos de usuario',
        error: error.message
      });
    }
  }

  // Get tipo usuario by ID
  static async getById(req, res) {
    try {
      const tipoUsuario = await TipoUsuario.findById(req.params.id);
      
      if (!tipoUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoUsuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo tipo de usuario',
        error: error.message
      });
    }
  }

  // Create new tipo usuario
  static async create(req, res) {
    try {
      // Validate required fields
      const { codigo, nombre } = req.body;
      
      if (!codigo || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Código y nombre son requeridos'
        });
      }

      // Check for duplicate code
      const existingTipo = await TipoUsuario.findOne({ codigo });
      if (existingTipo) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un tipo de usuario con este código'
        });
      }

      // Create tipo usuario
      const tipoUsuario = new TipoUsuario(req.body);
      const savedTipoUsuario = await tipoUsuario.save();

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'TipoUsuario',
          idEntidad: savedTipoUsuario._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedTipoUsuario.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Tipo de usuario creado exitosamente',
        data: savedTipoUsuario
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando tipo de usuario',
        error: error.message
      });
    }
  }

  // Update tipo usuario
  static async update(req, res) {
    try {
      const tipoUsuarioAnterior = await TipoUsuario.findById(req.params.id);
      
      if (!tipoUsuarioAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de usuario no encontrado'
        });
      }

      const tipoUsuario = await TipoUsuario.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Audit log
      const session = await mongoose.startSession();
      await UsuarioAuditoria.create([{
        entidad: 'TipoUsuario',
        idEntidad: tipoUsuario._id,
        accion: 'UPDATE',
        usuarioId: req.userId || tipoUsuario._id,
        datosAnteriores: tipoUsuarioAnterior.toObject(),
        datosNuevos: tipoUsuario.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });
      await session.endSession();

      res.json({
        success: true,
        message: 'Tipo de usuario actualizado exitosamente',
        data: tipoUsuario
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando tipo de usuario',
        error: error.message
      });
    }
  }

  // Delete tipo usuario
  static async delete(req, res) {
    try {
      const tipoUsuario = await TipoUsuario.findById(req.params.id);
      
      if (!tipoUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de usuario no encontrado'
        });
      }

      await TipoUsuario.findByIdAndDelete(req.params.id);

      // Audit log
      const session = await mongoose.startSession();
      await UsuarioAuditoria.create([{
        entidad: 'TipoUsuario',
        idEntidad: tipoUsuario._id,
        accion: 'DELETE',
        usuarioId: req.userId || tipoUsuario._id,
        datosAnteriores: tipoUsuario.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });
      await session.endSession();

      res.json({
        success: true,
        message: 'Tipo de usuario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando tipo de usuario',
        error: error.message
      });
    }
  }

  // Get by codigo
  static async getByCodigo(req, res) {
    try {
      const tipoUsuario = await TipoUsuario.findOne({ codigo: req.params.codigo });
      
      if (!tipoUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoUsuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo tipo de usuario por código',
        error: error.message
      });
    }
  }
}

module.exports = TipoUsuarioController;
