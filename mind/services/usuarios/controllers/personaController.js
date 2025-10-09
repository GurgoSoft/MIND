const mongoose = require('mongoose');
const Persona = require('../../../shared/models/usuarios/Persona');
const UsuarioAuditoria = require('../../../shared/models/usuarios/UsuarioAuditoria');
const Pais = require('../../../shared/models/administrativo/Pais');
const Departamento = require('../../../shared/models/administrativo/Departamento');
const Ciudad = require('../../../shared/models/administrativo/Ciudad');

class PersonaController {
  // Get all personas with pagination and filtering
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.tipoDoc) {
        filter.tipoDoc = req.query.tipoDoc;
      }
      if (req.query.idPais) {
        filter.idPais = req.query.idPais;
      }
      if (req.query.idDepartamento) {
        filter.idDepartamento = req.query.idDepartamento;
      }
      if (req.query.idCiudad) {
        filter.idCiudad = req.query.idCiudad;
      }

      const personas = await Persona.find(filter)
        .populate([
          { path: 'idPais', select: 'nombre codigoISO' },
          { path: 'idDepartamento', select: 'nombre codigoDANE' },
          { path: 'idCiudad', select: 'nombre codigoDANE' }
        ])
        .sort({ apellidos: 1, nombres: 1 });

      res.json({
        success: true,
        data: personas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo personas',
        error: error.message
      });
    }
  }

  // Get persona by ID
  static async getById(req, res) {
    try {
      const persona = await Persona.findById(req.params.id)
        .populate([
          { path: 'idPais', select: 'nombre codigoISO' },
          { path: 'idDepartamento', select: 'nombre codigoDANE' },
          { path: 'idCiudad', select: 'nombre codigoDANE' }
        ]);
      
      if (!persona) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }

      res.json({
        success: true,
        data: persona
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo persona',
        error: error.message
      });
    }
  }

  // Create new persona
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombres, apellidos, tipoDoc, numDoc, fechaNacimiento, idPais, idDepartamento, idCiudad } = req.body;
      
      if (!nombres || !apellidos || !tipoDoc || !numDoc || !fechaNacimiento || !idPais || !idDepartamento || !idCiudad) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Validate references exist

      const paisExists = await Pais.findById(idPais);
      if (!paisExists) {
        return res.status(400).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      const departamentoExists = await Departamento.findById(idDepartamento);
      if (!departamentoExists) {
        return res.status(400).json({
          success: false,
          message: 'Departamento no encontrado'
        });
      }

      const ciudadExists = await Ciudad.findById(idCiudad);
      if (!ciudadExists) {
        return res.status(400).json({
          success: false,
          message: 'Ciudad no encontrada'
        });
      }

      // Check for duplicate document
      const existingPersona = await Persona.findOne({ tipoDoc, numDoc });
      if (existingPersona) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una persona con este documento'
        });
      }

      // Create persona
      const persona = new Persona(req.body);
      const savedPersona = await persona.save();
      
      await savedPersona.populate([
        { path: 'idPais', select: 'nombre codigoISO' },
        { path: 'idDepartamento', select: 'nombre codigoDANE' },
        { path: 'idCiudad', select: 'nombre codigoDANE' }
      ]);

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Persona',
          idEntidad: savedPersona._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedPersona.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Persona creada exitosamente',
        data: savedPersona
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando persona',
        error: error.message
      });
    }
  }

  // Update persona
  static async update(req, res) {
    try {
      const personaAnterior = await Persona.findById(req.params.id);
      
      if (!personaAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }

      // Validate references if they are being updated
      if (req.body.idPais) {
        const paisExists = await Pais.findById(req.body.idPais);
        if (!paisExists) {
          return res.status(400).json({
            success: false,
            message: 'País no encontrado'
          });
        }
      }

      if (req.body.idDepartamento) {
        const departamentoExists = await Departamento.findById(req.body.idDepartamento);
        if (!departamentoExists) {
          return res.status(400).json({
            success: false,
            message: 'Departamento no encontrado'
          });
        }
      }

      if (req.body.idCiudad) {
        const ciudadExists = await Ciudad.findById(req.body.idCiudad);
        if (!ciudadExists) {
          return res.status(400).json({
            success: false,
            message: 'Ciudad no encontrada'
          });
        }
      }

      // Check for duplicate document if document is being updated
      if (req.body.tipoDoc || req.body.numDoc) {
        const tipoDoc = req.body.tipoDoc || personaAnterior.tipoDoc;
        const numDoc = req.body.numDoc || personaAnterior.numDoc;
        
        const existingPersona = await Persona.findOne({ 
          tipoDoc, 
          numDoc, 
          _id: { $ne: req.params.id } 
        });
        
        if (existingPersona) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otra persona con este documento'
          });
        }
      }

      const persona = await Persona.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: 'idPais', select: 'nombre codigoISO' },
        { path: 'idDepartamento', select: 'nombre codigoDANE' },
        { path: 'idCiudad', select: 'nombre codigoDANE' }
      ]);

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Persona',
          idEntidad: persona._id,
          accion: 'UPDATE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: personaAnterior.toObject(),
          datosNuevos: persona.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Persona actualizada exitosamente',
        data: persona
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando persona',
        error: error.message
      });
    }
  }

  // Delete persona
  static async delete(req, res) {
    try {
      const persona = await Persona.findById(req.params.id);
      
      if (!persona) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }

      // Check if persona is associated with a user
      const Usuario = require('../../../shared/models/usuarios/Usuario');
      const usuarioAsociado = await Usuario.findOne({ idPersona: req.params.id });
      
      if (usuarioAsociado) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar una persona asociada a un usuario'
        });
      }

      await Persona.findByIdAndDelete(req.params.id);

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'Persona',
          idEntidad: persona._id,
          accion: 'DELETE',
          usuarioId: req.userId || 'sistema',
          datosAnteriores: persona.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Persona eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando persona',
        error: error.message
      });
    }
  }

  // Search personas by document
  static async searchByDocument(req, res) {
    try {
      const { tipoDoc, numDoc } = req.query;

      if (!tipoDoc || !numDoc) {
        return res.status(400).json({
          success: false,
          message: 'Tipo y número de documento son requeridos'
        });
      }

      const persona = await Persona.findOne({ tipoDoc, numDoc })
        .populate([
          { path: 'idPais', select: 'nombre codigoISO' },
          { path: 'idDepartamento', select: 'nombre codigoDANE' },
          { path: 'idCiudad', select: 'nombre codigoDANE' }
        ]);

      if (!persona) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada con ese documento'
        });
      }

      res.json({
        success: true,
        data: persona
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error buscando persona por documento',
        error: error.message
      });
    }
  }

  // Search personas by name
  static async searchByName(req, res) {
    try {
      const { query } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'La búsqueda debe tener al menos 2 caracteres'
        });
      }

      const personas = await Persona.find({
        $or: [
          { nombres: { $regex: query, $options: 'i' } },
          { apellidos: { $regex: query, $options: 'i' } }
        ]
      })
      .populate([
        { path: 'idPais', select: 'nombre codigoISO' },
        { path: 'idDepartamento', select: 'nombre codigoDANE' },
        { path: 'idCiudad', select: 'nombre codigoDANE' }
      ])
      .sort({ apellidos: 1, nombres: 1 })
      .limit(20);

      res.json({
        success: true,
        data: personas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error buscando personas por nombre',
        error: error.message
      });
    }
  }
}

module.exports = PersonaController;
