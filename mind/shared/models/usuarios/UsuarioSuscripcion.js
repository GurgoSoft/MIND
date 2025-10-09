const mongoose = require('mongoose');

const usuarioSuscripcionSchema = new mongoose.Schema({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  idSuscripcion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suscripcion',
    required: true
  },
  fechaInicio: {
    type: Date,
    required: true,
    default: Date.now
  },
  fechaFin: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    required: true,
    enum: ['activa', 'pausada', 'cancelada', 'expirada'],
    default: 'activa'
  },
  renovacionAutomatica: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'usuarios_suscripciones'
});

usuarioSuscripcionSchema.index({ idUsuario: 1, estado: 1 });

module.exports = mongoose.model('UsuarioSuscripcion', usuarioSuscripcionSchema);
