const mongoose = require('mongoose');

const seguimientoPacienteSchema = new mongoose.Schema({
  idCita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    required: true
  },
  idUsuarioPaciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  instrucciones: {
    type: String,
    required: true,
    trim: true
  },
  fechaProximaRevision: {
    type: Date
  },
  completado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'seguimientos_pacientes'
});

seguimientoPacienteSchema.index({ idUsuarioPaciente: 1, fechaProximaRevision: 1 });

module.exports = mongoose.model('SeguimientoPaciente', seguimientoPacienteSchema);
