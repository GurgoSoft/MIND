const mongoose = require('mongoose');
const Acceso = require('../../../shared/models/administrativo/Acceso');
const AccesoUsuario = require('../../../shared/models/administrativo/AccesoUsuario');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class AccesoController {
  // Get all accesos with pagination
  static async getAll(req, res) {
    try {

      const accesos = await Acceso.find()
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: accesos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo accesos',
        error: error.message
      });
    }
  }

  // Get acceso by ID
  static async getById(req, res) {
    try {
      const acceso = await Acceso.findById(req.params.id);
      
      if (!acceso) {
        return res.status(404).json({
          success: false,
          message: 'Acceso no encontrado'
        });
      }

      res.json({
        success: true,
        data: acceso
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo acceso',
        error: error.message
      });
    }
  }

  // Create new acceso
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
      const existingAcceso = await Acceso.findOne({ codigo });
      if (existingAcceso) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un acceso con este código'
        });
      }

      // Create acceso
      const acceso = new Acceso(req.body);
      const savedAcceso = await acceso.save();

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Acceso',
          idEntidad: savedAcceso._id,
          accion: 'CREATE',
          usuarioId: req.user?.id || 'sistema',
          datosNuevos: savedAcceso.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Acceso creado exitosamente',
        data: savedAcceso
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando acceso',
        error: error.message
      });
    }
  }

  // Update acceso
  static async update(req, res) {
    try {
      const accesoAnterior = await Acceso.findById(req.params.id);
      
      if (!accesoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Acceso no encontrado'
        });
      }

      const acceso = await Acceso.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Acceso',
          idEntidad: acceso._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: accesoAnterior.toObject(),
          datosNuevos: acceso.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Acceso actualizado exitosamente',
        data: acceso
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando acceso',
        error: error.message
      });
    }
  }

  // Delete acceso
  static async delete(req, res) {
    try {
      const acceso = await Acceso.findById(req.params.id);
      
      if (!acceso) {
        return res.status(404).json({
          success: false,
          message: 'Acceso no encontrado'
        });
      }

      await Acceso.findByIdAndDelete(req.params.id);

      // Check if access is assigned to any user
      const assignedAccess = await AccesoUsuario.findOne({ 
        idAcceso: acceso._id,
        activo: true 
      });

      if (assignedAccess) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el acceso porque está asignado a uno o más usuarios'
        });
      }

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Acceso',
          idEntidad: acceso._id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: acceso.toObject(),
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
        message: 'Acceso eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando acceso',
        error: error.message
      });
    }
  }

  // Assign access to user
  static async assignToUser(req, res) {
    try {
      const { idUsuario, idAcceso } = req.body;

      // Check if assignment already exists
      const existingAssignment = await AccesoUsuario.findOne({
        idUsuario,
        idAcceso,
        activo: true
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya tiene este acceso asignado'
        });
      }

      const accesoUsuario = new AccesoUsuario({
        idUsuario,
        idAcceso
      });

      await accesoUsuario.save();
      await accesoUsuario.populate(['idUsuario', 'idAcceso']);

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

      res.status(201).json({
        success: true,
        message: 'Acceso asignado al usuario exitosamente',
        data: accesoUsuario
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error asignando acceso al usuario',
        error: error.message
      });
    }
  }

  // Revoke access from user
  static async revokeFromUser(req, res) {
    try {
      const { idUsuario, idAcceso } = req.body;

      const accesoUsuario = await AccesoUsuario.findOne({
        idUsuario,
        idAcceso,
        activo: true
      });

      if (!accesoUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Asignación de acceso no encontrada'
        });
      }

      const accesoAnterior = { ...accesoUsuario.toObject() };
      accesoUsuario.activo = false;
      await accesoUsuario.save();

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'AccesoUsuario',
          idEntidad: accesoUsuario._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: accesoAnterior,
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
        message: 'Acceso revocado del usuario exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error revocando acceso del usuario',
        error: error.message
      });
    }
  }

  // Get user accesses
  static async getUserAccesses(req, res) {
    try {
      const { idUsuario } = req.params;

      const accesos = await AccesoUsuario.find({
        idUsuario,
        activo: true
      }).populate('idAcceso', 'codigo nombre scope');

      res.json({
        success: true,
        data: accesos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo accesos del usuario',
        error: error.message
      });
    }
  }
}

module.exports = AccesoController;
