const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  idAgenda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agenda',
    required: true
  },
  idUsuarioEspecialista: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  idUsuarioPaciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaHoraInicio: {
    type: Date,
    required: true
  },
  fechaHoraFin: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    required: true,
    enum: ['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'],
    default: 'programada'
  },
  modalidad: {
    type: String,
    required: true,
    enum: ['presencial', 'virtual', 'telefonica'],
    default: 'presencial'
  },
  ubicacion: {
    type: String,
    trim: true
  },
  notas: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'citas'
});

citaSchema.index({ idAgenda: 1, fechaHoraInicio: 1 });
citaSchema.index({ idUsuarioEspecialista: 1, fechaHoraInicio: 1 });
citaSchema.index({ idUsuarioPaciente: 1, fechaHoraInicio: 1 });

module.exports = mongoose.model('Cita', citaSchema);
