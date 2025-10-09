const mongoose = require('mongoose');

const registroCitaSchema = new mongoose.Schema({
  idCita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    required: true
  },
  evento: {
    type: String,
    required: true,
    enum: ['programada', 'confirmada', 'iniciada', 'finalizada', 'cancelada', 'reprogramada'],
    default: 'programada'
  },
  fechaEvento: {
    type: Date,
    required: true,
    default: Date.now
  },
  observaciones: {
    type: String,
    trim: true
  },
  usuarioRegistro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true,
  collection: 'registros_citas'
});

registroCitaSchema.index({ idCita: 1, fechaEvento: -1 });

module.exports = mongoose.model('RegistroCita', registroCitaSchema);
