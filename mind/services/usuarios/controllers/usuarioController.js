const mongoose = require('mongoose');
const Usuario = require('../../../shared/models/usuarios/Usuario');
const UsuarioAuditoria = require('../../../shared/models/usuarios/UsuarioAuditoria');

class UsuarioController {
  // Get all usuarios
  static async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.idTipoUsuario) {
        filter.idTipoUsuario = req.query.idTipoUsuario;
      }
      if (req.query.activo !== undefined) {
        filter.activo = req.query.activo === 'true';
      }

      const usuarios = await Usuario.find(filter)
        .populate([
          { path: 'idPersona', select: 'nombres apellidos tipoDoc numDoc' },
          { path: 'idTipoUsuario', select: 'codigo nombre' },
          { path: 'idEstado', select: 'codigo nombre color' }
        ])
        .sort({ fechaCreacion: -1 });

      res.json({
        success: true,
        data: usuarios
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo usuarios',
        error: error.message
      });
    }
  }

  // Get usuario by ID
  static async getById(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id)
        .populate([
          { path: 'idPersona' },
          { path: 'idTipoUsuario', select: 'codigo nombre' },
          { path: 'idEstado', select: 'codigo nombre color' }
        ])
        .select('-passwordHash');
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo usuario',
        error: error.message
      });
    }
  }

  // Update usuario
  static async update(req, res) {
    try {
      const usuarioAnterior = await Usuario.findById(req.params.id);
      
      if (!usuarioAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Don't allow password updates through this endpoint
      const updateData = { ...req.body };
      delete updateData.passwordHash;

      const usuario = await Usuario.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: 'idPersona' },
        { path: 'idTipoUsuario', select: 'codigo nombre' },
        { path: 'idEstado', select: 'codigo nombre color' }
      ]).select('-passwordHash');

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: usuario._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: usuarioAnterior.toObject(),
          datosNuevos: usuario.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuario
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando usuario',
        error: error.message
      });
    }
  }

  // Toggle active status
  static async toggleActive(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuarioAnterior = { ...usuario.toObject() };
      usuario.activo = !usuario.activo;
      await usuario.save();

      // Audit log
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: usuario._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: usuarioAnterior,
          datosNuevos: usuario.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
        data: { _id: usuario._id, activo: usuario.activo }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado del usuario',
        error: error.message
      });
    }
  }

  // Unblock user
  static async unblock(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (!usuario.bloqueado) {
        return res.status(400).json({
          success: false,
          message: 'El usuario no está bloqueado'
        });
      }

      const usuarioAnterior = { ...usuario.toObject() };
      usuario.bloqueado = false;
      usuario.intentosFallidos = 0;
      usuario.fechaBloqueo = null;
      await usuario.save();

      // Audit log
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: usuario._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: usuarioAnterior,
          datosNuevos: usuario.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Usuario desbloqueado exitosamente',
        data: { 
          _id: usuario._id, 
          bloqueado: usuario.bloqueado,
          intentosFallidos: usuario.intentosFallidos
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error desbloqueando usuario',
        error: error.message
      });
    }
  }

  // Delete usuario (soft delete by deactivating)
  static async delete(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuarioAnterior = { ...usuario.toObject() };
      usuario.activo = false;
      await usuario.save();

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Usuario',
          idEntidad: usuario._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: usuarioAnterior,
          datosNuevos: usuario.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando usuario',
        error: error.message
      });
    }
  }

  // Get user statistics
  static async getStats(req, res) {
    try {
      const stats = await Usuario.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            activos: { $sum: { $cond: ['$activo', 1, 0] } },
            inactivos: { $sum: { $cond: ['$activo', 0, 1] } },
            bloqueados: { $sum: { $cond: ['$bloqueado', 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        activos: 0,
        inactivos: 0,
        bloqueados: 0
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de usuarios',
        error: error.message
      });
    }
  }
}

module.exports = UsuarioController;
