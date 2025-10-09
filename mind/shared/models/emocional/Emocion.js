const mongoose = require('mongoose');

const emocionSchema = new mongoose.Schema({
  idTipoEmocion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoEmocion',
    required: true
  },
  idEmocion: {
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
  descripcion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'emociones'
});

emocionSchema.index({ idTipoEmocion: 1 });

module.exports = mongoose.model('Emocion', emocionSchema);
