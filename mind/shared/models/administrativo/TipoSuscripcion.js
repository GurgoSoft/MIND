const mongoose = require('mongoose');

const tipoSuscripcionSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'tipos_suscripciones'
});

module.exports = mongoose.model('TipoSuscripcion', tipoSuscripcionSchema);
