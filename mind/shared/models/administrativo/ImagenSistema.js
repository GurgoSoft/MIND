const mongoose = require('mongoose');

const imagenSistemaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['logo', 'banner', 'avatar', 'background', 'icon', 'other'],
    default: 'other'
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  hash: {
    type: String,
    trim: true
  },
  metadata: {
    size: Number,
    width: Number,
    height: Number,
    format: String
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'imagenes_sistema'
});

module.exports = mongoose.model('ImagenSistema', imagenSistemaSchema);
