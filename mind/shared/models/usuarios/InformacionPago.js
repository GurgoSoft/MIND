const mongoose = require('mongoose');

const informacionPagoSchema = new mongoose.Schema({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  proveedor: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'mercadopago', 'wompi', 'payu'],
    default: 'stripe'
  },
  customerId: {
    type: String,
    required: true,
    trim: true
  },
  metodoPago: {
    type: String,
    enum: ['card', 'bank_transfer', 'digital_wallet'],
    default: 'card'
  },
  ultimaTransaccion: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'informacion_pagos'
});

module.exports = mongoose.model('InformacionPago', informacionPagoSchema);
