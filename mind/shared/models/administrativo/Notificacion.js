const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  idTipoNotificacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoNotificacion',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  mensaje: {
    type: String,
    required: true,
    trim: true
  },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaProgramada: {
    type: Date,
    default: Date.now
  },
  enviado: {
    type: Boolean,
    default: false
  },
  fechaEnvio: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'notificaciones'
});

notificacionSchema.index({ destinatario: 1, enviado: 1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);
