const mongoose = require('mongoose');

const suscripcionSchema = new mongoose.Schema({
  idTipoSuscripcion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoSuscripcion',
    required: true
  },
  nombrePlan: {
    type: String,
    required: true,
    trim: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  periodicidad: {
    type: String,
    required: true,
    enum: ['mensual', 'trimestral', 'semestral', 'anual'],
    default: 'mensual'
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'suscripciones'
});

module.exports = mongoose.model('Suscripcion', suscripcionSchema);
