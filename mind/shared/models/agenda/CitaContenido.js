const mongoose = require('mongoose');

const citaContenidoSchema = new mongoose.Schema({
  idCita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    required: true,
    unique: true
  },
  notas: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'citas_contenido'
});

module.exports = mongoose.model('CitaContenido', citaContenidoSchema);
