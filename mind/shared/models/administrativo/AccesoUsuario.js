const mongoose = require('mongoose');

const accesoUsuarioSchema = new mongoose.Schema({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  idAcceso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Acceso',
    required: true
  },
  fechaAsignacion: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'accesos_usuarios'
});

accesoUsuarioSchema.index({ idUsuario: 1, idAcceso: 1 }, { unique: true });

module.exports = mongoose.model('AccesoUsuario', accesoUsuarioSchema);
