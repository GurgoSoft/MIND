const mongoose = require('mongoose');

const tipoNotificacionSchema = new mongoose.Schema({
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
  collection: 'tipos_notificaciones'
});

module.exports = mongoose.model('TipoNotificacion', tipoNotificacionSchema);
