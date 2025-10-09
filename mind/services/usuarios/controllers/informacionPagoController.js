const mongoose = require('mongoose');
const InformacionPago = require('../../../shared/models/usuarios/InformacionPago');
const UsuarioAuditoria = require('../../../shared/models/usuarios/UsuarioAuditoria');

class InformacionPagoController {
  // Get all informacion pagos
  static async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.proveedor) {
        filter.proveedor = req.query.proveedor;
      }
      if (req.query.metodoPago) {
        filter.metodoPago = req.query.metodoPago;
      }
      if (req.query.activo !== undefined) {
        filter.activo = req.query.activo === 'true';
      }

      const informacionPagos = await InformacionPago.find(filter)
        .populate({ path: 'idUsuario', select: 'email telefono' })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: informacionPagos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo información de pagos',
        error: error.message
      });
    }
  }

  // Get informacion pago by ID
  static async getById(req, res) {
    try {
      const informacionPago = await InformacionPago.findById(req.params.id)
        .populate({ path: 'idUsuario', select: 'email telefono' });
      
      if (!informacionPago) {
        return res.status(404).json({
          success: false,
          message: 'Información de pago no encontrada'
        });
      }

      res.json({
        success: true,
        data: informacionPago
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo información de pago',
        error: error.message
      });
    }
  }

  // Create new informacion pago
  static async create(req, res) {
    try {
      // Validate required fields
      const { idUsuario, tipoTarjeta, numeroTarjeta, fechaVencimiento } = req.body;
      
      if (!idUsuario || !tipoTarjeta || !numeroTarjeta || !fechaVencimiento) {
        return res.status(400).json({
          success: false,
          message: 'Usuario, tipo de tarjeta, número y fecha de vencimiento son requeridos'
        });
      }

      // Validate user exists
      const Usuario = require('../../../shared/models/usuarios/Usuario');
      const usuarioExists = await Usuario.findById(idUsuario);
      if (!usuarioExists) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Check for existing payment info
      const existingInfo = await InformacionPago.findOne({ idUsuario });
      if (existingInfo) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya tiene información de pago registrada'
        });
      }

      // Create payment info
      const informacionPago = new InformacionPago(req.body);
      const savedInfo = await informacionPago.save();

      await savedInfo.populate({ path: 'idUsuario', select: 'email telefono' });

      // Audit log (non-critical)
      try {
        await UsuarioAuditoria.create({
          entidad: 'InformacionPago',
          idEntidad: savedInfo._id,
          accion: 'CREATE',
          usuarioId: req.userId || 'sistema',
          datosNuevos: savedInfo.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Información de pago creada exitosamente',
        data: savedInfo
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando información de pago',
        error: error.message
      });
    }
  }

  // Update informacion pago
  static async update(req, res) {
    try {
      const informacionPagoAnterior = await InformacionPago.findById(req.params.id);
      
      if (!informacionPagoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Información de pago no encontrada'
        });
      }

      const informacionPago = await InformacionPago.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate({ path: 'idUsuario', select: 'email telefono' });

      // Audit log
      await UsuarioAuditoria.create([{
        entidad: 'InformacionPago',
        idEntidad: informacionPago._id,
        accion: 'UPDATE',
        usuarioId: req.userId || informacionPago.idUsuario,
        datosAnteriores: informacionPagoAnterior.toObject(),
        datosNuevos: informacionPago.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });

      res.json({
        success: true,
        message: 'Información de pago actualizada exitosamente',
        data: informacionPago
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando información de pago',
        error: error.message
      });
    }
  }

  // Delete informacion pago
  static async delete(req, res) {
    try {
      const informacionPago = await InformacionPago.findById(req.params.id);
      
      if (!informacionPago) {
        return res.status(404).json({
          success: false,
          message: 'Información de pago no encontrada'
        });
      }

      await InformacionPago.findByIdAndDelete(req.params.id);

      // Audit log
      await UsuarioAuditoria.create([{
        entidad: 'InformacionPago',
        idEntidad: informacionPago._id,
        accion: 'DELETE',
        usuarioId: req.userId || informacionPago.idUsuario,
        datosAnteriores: informacionPago.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });

      res.json({
        success: true,
        message: 'Información de pago eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando información de pago',
        error: error.message
      });
    }
  }

  // Get by user ID
  static async getByUserId(req, res) {
    try {
      const informacionPago = await InformacionPago.findOne({ idUsuario: req.params.userId })
        .populate({ path: 'idUsuario', select: 'email telefono' });
      
      if (!informacionPago) {
        return res.status(404).json({
          success: false,
          message: 'Información de pago no encontrada para este usuario'
        });
      }

      res.json({
        success: true,
        data: informacionPago
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo información de pago del usuario',
        error: error.message
      });
    }
  }
}

module.exports = InformacionPagoController;
