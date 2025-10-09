const mongoose = require('mongoose');
const AccesoUsuario = require('../../../shared/models/administrativo/AccesoUsuario');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');
const Persona = require('../../../shared/models/usuarios/Persona');
const Usuario = require('../../../shared/models/usuarios/Usuario');
const TipoUsuario = require('../../../shared/models/usuarios/TipoUsuario');

class AccesoUsuarioController {
  // Get all access-user relationships with pagination and filtering
  static async getAll(req, res) {
    try {

      // Build filter object
      const filter = {};
      if (req.query.usuarioId) filter.usuarioId = req.query.usuarioId;
      if (req.query.accesoId) filter.accesoId = req.query.accesoId;
      if (req.query.activo !== undefined) filter.activo = req.query.activo === 'true';

            const accesosUsuario = await AccesoUsuario.find(filter)
        .populate('usuarioId', 'nombre email')
        .populate('accesoId', 'nombre descripcion')
        
        .sort({ fechaAsignacion: -1 });

      res.json({
        success: true,
        data: accesosUsuario,
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
        message: 'Error al obtener accesos de usuario',
        error: error.message
      });
    }
  }

  // Get access-user relationship by ID
  static async getById(req, res) {
    try {
      const accesoUsuario = await AccesoUsuario.findById(req.params.id)
        .populate('usuarioId', 'nombre email')
        .populate('accesoId', 'nombre descripcion');

      if (!accesoUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Acceso de usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: accesoUsuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener acceso de usuario',
        error: error.message
      });
    }
  }

  // Get accesses by user ID
  static async getByUsuario(req, res) {
    try {
      const accesosUsuario = await AccesoUsuario.find({ usuarioId: req.params.usuarioId })
        .populate('accesoId', 'nombre descripcion tipo')
        .sort({ fechaAsignacion: -1 });

      res.json({
        success: true,
        data: accesosUsuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener accesos del usuario',
        error: error.message
      });
    }
  }

  // Create new access-user relationship
  static async create(req, res) {
    try {
      // Validate required fields
      const { usuarioId, accesoId } = req.body;
      if (!usuarioId || !accesoId) {
        return res.status(400).json({
          success: false,
          message: 'Los campos usuarioId y accesoId son obligatorios'
        });
      }

      // Check if user exists
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) {
        return res.status(400).json({
          success: false,
          message: 'El usuario especificado no existe'
        });
      }

      // Check if access already exists for this user
      const existingAccess = await AccesoUsuario.findOne({ 
        usuarioId,
        accesoId
      });

      if (existingAccess) {
        return res.status(400).json({
          success: false,
          message: 'Este usuario ya tiene asignado este acceso'
        });
      }

      const accesoUsuario = new AccesoUsuario({
        ...req.body,
        fechaAsignacion: new Date(),
        usuarioAsignacion: req.user?.id || 'sistema'
      });
      
      await accesoUsuario.save();

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'AccesoUsuario',
          idEntidad: accesoUsuario._id,
          accion: 'CREATE',
          usuarioId: req.user?.id || 'sistema',
          datosNuevos: accesoUsuario.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      const populatedAccesoUsuario = await AccesoUsuario.findById(accesoUsuario._id)
        .populate('usuarioId', 'nombre email')
        .populate('accesoId', 'nombre descripcion');

      res.status(201).json({
        success: true,
        message: 'Acceso de usuario creado exitosamente',
        data: populatedAccesoUsuario
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear acceso de usuario',
        error: error.message
      });
    }
  }

  // Update access-user relationship
  static async update(req, res) {
    try {
      const accesoUsuarioAnterior = await AccesoUsuario.findById(req.params.id);
      if (!accesoUsuarioAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Acceso de usuario no encontrado'
        });
      }

      const accesoUsuario = await AccesoUsuario.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('usuarioId', 'nombre email')
       .populate('accesoId', 'nombre descripcion');

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'AccesoUsuario',
          idEntidad: accesoUsuario._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: accesoUsuarioAnterior.toObject(),
          datosNuevos: accesoUsuario.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Acceso de usuario actualizado exitosamente',
        data: accesoUsuario
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar acceso de usuario',
        error: error.message
      });
    }
  }

  // Delete access-user relationship
  static async delete(req, res) {
    try {
      const accesoUsuario = await AccesoUsuario.findById(req.params.id);
      if (!accesoUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Acceso de usuario no encontrado'
        });
      }

      await AccesoUsuario.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'AccesoUsuario',
          idEntidad: accesoUsuario._id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: accesoUsuario.toObject(),
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
        message: 'Acceso de usuario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar acceso de usuario',
        error: error.message
      });
    }
  }
}

module.exports = AccesoUsuarioController;
