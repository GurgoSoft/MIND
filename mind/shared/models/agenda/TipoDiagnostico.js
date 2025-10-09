const mongoose = require('mongoose');

const tipoDiagnosticoSchema = new mongoose.Schema({
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
  collection: 'tipos_diagnosticos'
});

module.exports = mongoose.model('TipoDiagnostico', tipoDiagnosticoSchema);
