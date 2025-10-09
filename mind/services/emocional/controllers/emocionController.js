const mongoose = require('mongoose');
const Emocion = require('../../../shared/models/emocional/Emocion');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class EmocionController {
  // Get all emociones with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.idTipoEmocion) {
        filter.idTipoEmocion = req.query.idTipoEmocion;
      }

      const emociones = await Emocion.find(filter)
        .populate('idTipoEmocion', 'codigo nombre')
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: emociones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo emociones',
        error: error.message
      });
    }
  }

  // Get emocion by ID
  static async getById(req, res) {
    try {
      const emocion = await Emocion.findById(req.params.id)
        .populate('idTipoEmocion', 'codigo nombre');
      
      if (!emocion) {
        return res.status(404).json({
          success: false,
          message: 'Emoción no encontrada'
        });
      }

      res.json({
        success: true,
        data: emocion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo emoción',
        error: error.message
      });
    }
  }

  // Create new emocion
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, descripcion, idTipoEmocion } = req.body;
      if (!nombre || !descripcion || !idTipoEmocion) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, descripción y tipo de emoción son requeridos'
        });
      }

      // Validate foreign key
      const TipoEmocion = require('../../../shared/models/emocional/TipoEmocion');
      const tipoEmocionExists = await TipoEmocion.findById(idTipoEmocion);
      if (!tipoEmocionExists) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de emoción especificado no existe'
        });
      }

      // Check for duplicates
      const existingEmocion = await Emocion.findOne({ nombre: nombre.trim() });
      if (existingEmocion) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una emoción con ese nombre'
        });
      }

      const emocion = new Emocion(req.body);
      await emocion.save();
      
      await emocion.populate('idTipoEmocion', 'codigo nombre');

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Emocion',
          idEntidad: emocion._id,
          accion: 'CREATE',
          usuarioId: req.userId,
          datosNuevos: emocion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Emoción creada exitosamente',
        data: emocion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando emoción',
        error: error.message
      });
    }
  }

  // Update emocion
  static async update(req, res) {
    try {
      const emocionAnterior = await Emocion.findById(req.params.id);
      
      if (!emocionAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Emoción no encontrada'
        });
      }

      const emocion = await Emocion.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('idTipoEmocion', 'codigo nombre');

      // Validate foreign key if changing type
      if (req.body.idTipoEmocion && req.body.idTipoEmocion !== emocionAnterior.idTipoEmocion.toString()) {
        const TipoEmocion = require('../../../shared/models/emocional/TipoEmocion');
        const tipoEmocionExists = await TipoEmocion.findById(req.body.idTipoEmocion);
        if (!tipoEmocionExists) {
          return res.status(400).json({
            success: false,
            message: 'El tipo de emoción especificado no existe'
          });
        }
      }

      // Validate duplicate name if changing name
      if (req.body.nombre && req.body.nombre !== emocionAnterior.nombre) {
        const existingEmocion = await Emocion.findOne({ 
          nombre: req.body.nombre.trim(),
          _id: { $ne: req.params.id }
        });
        if (existingEmocion) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe una emoción con ese nombre'
          });
        }
      }

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Emocion',
          idEntidad: emocion._id,
          accion: 'UPDATE',
          usuarioId: req.userId,
          datosAnteriores: emocionAnterior.toObject(),
          datosNuevos: emocion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Emoción actualizada exitosamente',
        data: emocion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando emoción',
        error: error.message
      });
    }
  }

  // Delete emocion
  static async delete(req, res) {
    try {
      const emocion = await Emocion.findById(req.params.id);
      
      if (!emocion) {
        return res.status(404).json({
          success: false,
          message: 'Emoción no encontrada'
        });
      }

      await Emocion.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Emocion',
          idEntidad: emocion._id,
          accion: 'DELETE',
          usuarioId: req.userId,
          datosAnteriores: emocion.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Emoción eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando emoción',
        error: error.message
      });
    }
  }

  // Get emociones by type
  static async getByType(req, res) {
    try {
      const { idTipoEmocion } = req.params;

      const emociones = await Emocion.find({ idTipoEmocion })
        .populate('idTipoEmocion', 'codigo nombre')
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: emociones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo emociones por tipo',
        error: error.message
      });
    }
  }
}

module.exports = EmocionController;
