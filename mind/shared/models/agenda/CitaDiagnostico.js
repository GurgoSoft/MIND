const mongoose = require('mongoose');

const citaDiagnosticoSchema = new mongoose.Schema({
  idCita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    required: true
  },
  idTipoDiagnostico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoDiagnostico',
    required: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'citas_diagnosticos'
});

citaDiagnosticoSchema.index({ idCita: 1 });

module.exports = mongoose.model('CitaDiagnostico', citaDiagnosticoSchema);
