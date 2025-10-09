const mongoose = require('mongoose');

const agendaDiaSchema = new mongoose.Schema({
  idAgenda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agenda',
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'agendas_dias'
});

agendaDiaSchema.index({ idAgenda: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('AgendaDia', agendaDiaSchema);
