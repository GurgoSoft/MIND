const mongoose = require('mongoose');

const diarioSensacionSchema = new mongoose.Schema({
  idDiario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diario',
    required: true
  },
  idSensacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensacion',
    required: true
  },
  intensidad: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, {
  timestamps: true,
  collection: 'diarios_sensaciones'
});

diarioSensacionSchema.index({ idDiario: 1, idSensacion: 1 }, { unique: true });

module.exports = mongoose.model('DiarioSensacion', diarioSensacionSchema);
