const mongoose = require('mongoose');
const Pais = require('../../../shared/models/administrativo/Pais');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class PaisController {
  // Get all paises with pagination
  static async getAll(req, res) {
    try {

      const paises = await Pais.find()
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: paises
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo países',
        error: error.message
      });
    }
  }

  // Get pais by ID
  static async getById(req, res) {
    try {
      const pais = await Pais.findById(req.params.id);
      
      if (!pais) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      res.json({
        success: true,
        data: pais
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo país',
        error: error.message
      });
    }
  }

  // Create new pais
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, codigoISO } = req.body;
      
      if (!nombre || !codigoISO) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y código ISO son requeridos'
        });
      }

      // Check for duplicate code
      const existingPais = await Pais.findOne({ codigoISO });
      if (existingPais) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un país con este código ISO'
        });
      }

      // Create pais
      const pais = new Pais(req.body);
      const savedPais = await pais.save();

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Pais',
          idEntidad: savedPais._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedPais.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'País creado exitosamente',
        data: savedPais
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando país',
        error: error.message
      });
    }
  }

  // Update pais
  static async update(req, res) {
    try {
      const paisAnterior = await Pais.findById(req.params.id);
      
      if (!paisAnterior) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      const pais = await Pais.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Pais',
          idEntidad: pais._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: paisAnterior.toObject(),
          datosNuevos: pais.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'País actualizado exitosamente',
        data: pais
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando país',
        error: error.message
      });
    }
  }

  // Delete pais
  static async delete(req, res) {
    try {
      const pais = await Pais.findById(req.params.id);
      
      if (!pais) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      await Pais.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Pais',
          idEntidad: pais._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: pais.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'País eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando país',
        error: error.message
      });
    }
  }
}

module.exports = PaisController;
