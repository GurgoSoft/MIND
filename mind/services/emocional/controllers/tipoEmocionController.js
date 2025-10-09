const mongoose = require('mongoose');
const TipoEmocion = require('../../../shared/models/emocional/TipoEmocion');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class TipoEmocionController {
  // Get all emotion types with pagination and filtering
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

            const tiposEmocion = await TipoEmocion.find(filter)
        
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: tiposEmocion,
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
        message: 'Error al obtener tipos de emoción',
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Get emotion type by ID
  static async getById(req, res) {
    try {
      const tipoEmocion = await TipoEmocion.findById(req.params.id);

      if (!tipoEmocion) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de emoción no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipoEmocion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de emoción',
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Create new emotion type
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, descripcion } = req.body;
      if (!nombre || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y descripción son requeridos'
        });
      }

      // Check for duplicates
      const existingTipo = await TipoEmocion.findOne({ nombre: nombre.trim() });
      if (existingTipo) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un tipo de emoción con ese nombre'
        });
      }

      const tipoEmocion = new TipoEmocion(req.body);
      await tipoEmocion.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'TipoEmocion',
          idEntidad: tipoEmocion._id,
          accion: 'CREATE',
          datosAnteriores: null,
          datosNuevos: tipoEmocion.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Tipo de emoción creado exitosamente',
        data: tipoEmocion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear tipo de emoción',
        error: error.message
      });
    }
  }

  // Update emotion type
  static async update(req, res) {
    try {
      const tipoEmocionAnterior = await TipoEmocion.findById(req.params.id);
      if (!tipoEmocionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de emoción no encontrado'
        });
      }

      // Validate duplicate name if changing name
      if (req.body.nombre && req.body.nombre !== tipoEmocionAnterior.nombre) {
        const existingTipo = await TipoEmocion.findOne({ 
          nombre: req.body.nombre.trim(),
          _id: { $ne: req.params.id }
        });
        if (existingTipo) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un tipo de emoción con ese nombre'
          });
        }
      }

      const tipoEmocion = await TipoEmocion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'TipoEmocion',
          idEntidad: tipoEmocion._id,
          accion: 'UPDATE',
          datosAnteriores: tipoEmocionAnterior.toObject(),
          datosNuevos: tipoEmocion.toObject(),
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de emoción actualizado exitosamente',
        data: tipoEmocion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar tipo de emoción',
        error: error.message
      });
    }
  }

  // Delete emotion type
  static async delete(req, res) {
    try {
      const tipoEmocion = await TipoEmocion.findById(req.params.id);
      if (!tipoEmocion) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de emoción no encontrado'
        });
      }

      // Check for referential integrity (if needed)
      // const Emocion = require('../../../shared/models/emocional/Emocion');
      // const emocionesUsando = await Emocion.countDocuments({ idTipoEmocion: req.params.id });
      // if (emocionesUsando > 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'No se puede eliminar: existen emociones que usan este tipo'
      //   });
      // }

      await TipoEmocion.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'TipoEmocion',
          idEntidad: req.params.id,
          accion: 'DELETE',
          datosAnteriores: tipoEmocion.toObject(),
          datosNuevos: null,
          usuarioId: req.user?.id || 'sistema',
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Tipo de emoción eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de emoción',
        error: error.message
      });
    }
  }
}

module.exports = TipoEmocionController;
