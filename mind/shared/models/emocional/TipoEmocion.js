const mongoose = require('mongoose');

const tipoEmocionSchema = new mongoose.Schema({
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
  collection: 'tipos_emociones'
});

module.exports = mongoose.model('TipoEmocion', tipoEmocionSchema);
