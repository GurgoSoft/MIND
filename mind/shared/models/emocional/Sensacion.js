const mongoose = require('mongoose');

const sensacionSchema = new mongoose.Schema({
  idSensacion: {
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
    enum: ['fisica', 'mental', 'mixta'],
    default: 'fisica'
  },
  descripcion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'sensaciones'
});

module.exports = mongoose.model('Sensacion', sensacionSchema);
