const mongoose = require('mongoose');

const diarioSchema = new mongoose.Schema({
  idUsuario: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  nota: {
    type: String,
    required: true,
    trim: true
  },
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, {
  timestamps: true,
  collection: 'diarios'
});

diarioSchema.index({ idUsuario: 1, fecha: -1 });

module.exports = mongoose.model('Diario', diarioSchema);
