const mongoose = require('mongoose');
const Ciudad = require('../../../shared/models/administrativo/Ciudad');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class CiudadController {
  // Get all ciudades with pagination and filtering
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.idDepartamento) {
        filter.idDepartamento = req.query.idDepartamento;
      }

      const ciudades = await Ciudad.find(filter)
        .populate({
          path: 'idDepartamento',
          select: 'nombre codigoDANE',
          populate: {
            path: 'idPais',
            select: 'nombre codigoISO'
          }
        })
        .sort({ nombre: 1 })
        ;

            res.json({
        success: true,
        data: ciudades
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo ciudades',
        error: error.message
      });
    }
  }

  // Get ciudad by ID
  static async getById(req, res) {
    try {
      const ciudad = await Ciudad.findById(req.params.id)
        .populate({
          path: 'idDepartamento',
          select: 'nombre codigoDANE',
          populate: {
            path: 'idPais',
            select: 'nombre codigoISO'
          }
        });
      
      if (!ciudad) {
        return res.status(404).json({
          success: false,
          message: 'Ciudad no encontrada'
        });
      }

      res.json({
        success: true,
        data: ciudad
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo ciudad',
        error: error.message
      });
    }
  }

  // Create new ciudad
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, codigoDANE, idDepartamento } = req.body;
      
      if (!nombre || !codigoDANE || !idDepartamento) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, código DANE y departamento son requeridos'
        });
      }

      // Check for duplicate code
      const existingCiudad = await Ciudad.findOne({ codigoDANE });
      if (existingCiudad) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una ciudad con este código DANE'
        });
      }

      // Validate department exists
      const Departamento = require('../../../shared/models/administrativo/Departamento');
      const departamentoExists = await Departamento.findById(idDepartamento);
      if (!departamentoExists) {
        return res.status(400).json({
          success: false,
          message: 'Departamento no encontrado'
        });
      }

      // Create ciudad
      const ciudad = new Ciudad(req.body);
      const savedCiudad = await ciudad.save();
      
      await savedCiudad.populate({
        path: 'idDepartamento',
        select: 'nombre codigoDANE',
        populate: {
          path: 'idPais',
          select: 'nombre codigoISO'
        }
      });

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Ciudad',
          idEntidad: savedCiudad._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedCiudad.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Ciudad creada exitosamente',
        data: savedCiudad
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando ciudad',
        error: error.message
      });
    }
  }

  // Update ciudad
  static async update(req, res) {
    try {
      const ciudadAnterior = await Ciudad.findById(req.params.id);
      
      if (!ciudadAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Ciudad no encontrada'
        });
      }

      const ciudad = await Ciudad.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate({
        path: 'idDepartamento',
        select: 'nombre codigoDANE',
        populate: {
          path: 'idPais',
          select: 'nombre codigoISO'
        }
      });

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Ciudad',
          idEntidad: ciudad._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: ciudadAnterior.toObject(),
          datosNuevos: ciudad.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Ciudad actualizada exitosamente',
        data: ciudad
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando ciudad',
        error: error.message
      });
    }
  }

  // Delete ciudad
  static async delete(req, res) {
    try {
      const ciudad = await Ciudad.findById(req.params.id);
      
      if (!ciudad) {
        return res.status(404).json({
          success: false,
          message: 'Ciudad no encontrada'
        });
      }

      await Ciudad.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await AdministracionAuditoria.create({
          entidad: 'Ciudad',
          idEntidad: ciudad._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: ciudad.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Ciudad eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando ciudad',
        error: error.message
      });
    }
  }
}

module.exports = CiudadController;
