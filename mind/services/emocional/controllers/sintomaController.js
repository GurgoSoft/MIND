const mongoose = require('mongoose');
const Sintoma = require('../../../shared/models/emocional/Sintoma');
const DiarioAuditoria = require('../../../shared/models/emocional/DiarioAuditoria');

class SintomaController {
  // Get all sintomas with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.tipo) {
        filter.tipo = req.query.tipo;
      }

      const sintomas = await Sintoma.find(filter)
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: sintomas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo síntomas',
        error: error.message
      });
    }
  }

  // Get sintoma by ID
  static async getById(req, res) {
    try {
      const sintoma = await Sintoma.findById(req.params.id);
      
      if (!sintoma) {
        return res.status(404).json({
          success: false,
          message: 'Síntoma no encontrado'
        });
      }

      res.json({
        success: true,
        data: sintoma
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo síntoma',
        error: error.message
      });
    }
  }

  // Create new sintoma
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, descripcion, tipo } = req.body;
      if (!nombre || !descripcion || !tipo) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, descripción y tipo son requeridos'
        });
      }

      // Check for duplicates
      const existingSintoma = await Sintoma.findOne({ nombre: nombre.trim() });
      if (existingSintoma) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un síntoma con ese nombre'
        });
      }

      const sintoma = new Sintoma(req.body);
      await sintoma.save();

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sintoma',
          idEntidad: sintoma._id,
          accion: 'CREATE',
          usuarioId: req.userId,
          datosNuevos: sintoma.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Síntoma creado exitosamente',
        data: sintoma
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando síntoma',
        error: error.message
      });
    }
  }

  // Update sintoma
  static async update(req, res) {
    try {
      const sintomaAnterior = await Sintoma.findById(req.params.id);
      
      if (!sintomaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Síntoma no encontrado'
        });
      }

      // Validate duplicate name if changing name
      if (req.body.nombre && req.body.nombre !== sintomaAnterior.nombre) {
        const existingSintoma = await Sintoma.findOne({ 
          nombre: req.body.nombre.trim(),
          _id: { $ne: req.params.id }
        });
        if (existingSintoma) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un síntoma con ese nombre'
          });
        }
      }

      const sintoma = await Sintoma.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sintoma',
          idEntidad: sintoma._id,
          accion: 'UPDATE',
          usuarioId: req.userId,
          datosAnteriores: sintomaAnterior.toObject(),
          datosNuevos: sintoma.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Síntoma actualizado exitosamente',
        data: sintoma
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando síntoma',
        error: error.message
      });
    }
  }

  // Delete sintoma
  static async delete(req, res) {
    try {
      const sintoma = await Sintoma.findById(req.params.id);
      
      if (!sintoma) {
        return res.status(404).json({
          success: false,
          message: 'Síntoma no encontrado'
        });
      }

      await Sintoma.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await DiarioAuditoria.create({
          entidad: 'Sintoma',
          idEntidad: sintoma._id,
          accion: 'DELETE',
          usuarioId: req.userId,
          datosAnteriores: sintoma.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Síntoma eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando síntoma',
        error: error.message
      });
    }
  }

  // Get sintomas by type
  static async getByType(req, res) {
    try {
      const { tipo } = req.params;

      const sintomas = await Sintoma.find({ tipo })
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: sintomas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo síntomas por tipo',
        error: error.message
      });
    }
  }
}

module.exports = SintomaController;
