const mongoose = require('mongoose');

const sentimientoSchema = new mongoose.Schema({
  idSentimiento: {
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
    enum: ['positivo', 'negativo', 'neutro'],
    default: 'neutro'
  },
  descripcion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'sentimientos'
});

module.exports = mongoose.model('Sentimiento', sentimientoSchema);
