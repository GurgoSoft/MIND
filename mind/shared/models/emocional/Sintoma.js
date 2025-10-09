const mongoose = require('mongoose');

const sintomaSchema = new mongoose.Schema({
  idSintoma: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['fisico', 'psicologico', 'cognitivo', 'conductual'],
    default: 'fisico'
  },
  descripcion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'sintomas'
});

module.exports = mongoose.model('Sintoma', sintomaSchema);
