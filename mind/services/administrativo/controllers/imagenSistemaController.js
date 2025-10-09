const mongoose = require('mongoose');
const ImagenSistema = require('../../../shared/models/administrativo/ImagenSistema');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class ImagenSistemaController {
  // Get all imagenes with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.tipo) {
        filter.tipo = req.query.tipo;
      }
      if (req.query.activo !== undefined) {
        filter.activo = req.query.activo === 'true';
      }

      const imagenes = await ImagenSistema.find(filter)
        .sort({ createdAt: -1 })
        ;

            res.json({
        success: true,
        data: imagenes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo imágenes del sistema',
        error: error.message
      });
    }
  }

  // Get imagen by ID
  static async getById(req, res) {
    try {
      const imagen = await ImagenSistema.findById(req.params.id);
      
      if (!imagen) {
        return res.status(404).json({
          success: false,
          message: 'Imagen no encontrada'
        });
      }

      res.json({
        success: true,
        data: imagen
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo imagen',
        error: error.message
      });
    }
  }

  // Create new imagen
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, tipo, url } = req.body;
      if (!nombre || !tipo || !url) {
        return res.status(400).json({
          success: false,
          message: 'Los campos nombre, tipo y url son obligatorios'
        });
      }

      // Check for duplicate image URL
      const existingImage = await ImagenSistema.findOne({ url });
      if (existingImage) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una imagen con esta URL'
        });
      }

      const imagen = new ImagenSistema({
        ...req.body,
        fechaCreacion: new Date(),
        usuarioCreacion: req.user?.id || 'sistema'
      });
      
      await imagen.save();

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'ImagenSistema',
          idEntidad: imagen._id,
          accion: 'CREATE',
          usuarioId: req.user?.id || 'sistema',
          datosNuevos: imagen.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Imagen creada exitosamente',
        data: imagen
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando imagen',
        error: error.message
      });
    }
  }

  // Update imagen
  static async update(req, res) {
    try {
      const imagenAnterior = await ImagenSistema.findById(req.params.id);
      
      if (!imagenAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Imagen no encontrada'
        });
      }

      const imagen = await ImagenSistema.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'ImagenSistema',
          idEntidad: imagen._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: imagenAnterior.toObject(),
          datosNuevos: imagen.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Imagen actualizada exitosamente',
        data: imagen
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando imagen',
        error: error.message
      });
    }
  }

  // Delete imagen
  static async delete(req, res) {
    try {
      const imagen = await ImagenSistema.findById(req.params.id);
      
      if (!imagen) {
        return res.status(404).json({
          success: false,
          message: 'Imagen no encontrada'
        });
      }

      // Prevent deletion if image is in use (example check - adjust based on your schema)
      // const inUse = await SomeModel.findOne({ imagenId: req.params.id });
      // if (inUse) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'No se puede eliminar la imagen porque está siendo utilizada'
      //   });
      // }

      await ImagenSistema.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'ImagenSistema',
          idEntidad: imagen._id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: imagen.toObject(),
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
        message: 'Imagen eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando imagen',
        error: error.message
      });
    }
  }

  // Get images by type
  static async getByType(req, res) {
    try {
      const { tipo } = req.params;

      const imagenes = await ImagenSistema.find({ 
        tipo,
        activo: true 
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: imagenes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo imágenes por tipo',
        error: error.message
      });
    }
  }

  // Toggle active status
  static async toggleActive(req, res) {
    try {
      const imagen = await ImagenSistema.findById(req.params.id);
      
      if (!imagen) {
        return res.status(404).json({
          success: false,
          message: 'Imagen no encontrada'
        });
      }

      const imagenAnterior = { ...imagen.toObject() };
      imagen.activo = !imagen.activo;
      await imagen.save();

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'ImagenSistema',
          idEntidad: imagen._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: imagenAnterior,
          datosNuevos: imagen.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: `Imagen ${imagen.activo ? 'activada' : 'desactivada'} exitosamente`,
        data: imagen
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado de imagen',
        error: error.message
      });
    }
  }
}

module.exports = ImagenSistemaController;
