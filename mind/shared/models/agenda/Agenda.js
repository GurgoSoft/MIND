const mongoose = require('mongoose');

const agendaSchema = new mongoose.Schema({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  idTipoAgenda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoAgenda',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'agendas'
});

agendaSchema.index({ idUsuario: 1 });

module.exports = mongoose.model('Agenda', agendaSchema);
