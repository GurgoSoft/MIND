const mongoose = require('mongoose');

const diarioSintomaSchema = new mongoose.Schema({
  idDiario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diario',
    required: true
  },
  idSintoma: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sintoma',
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
  collection: 'diarios_sintomas'
});

diarioSintomaSchema.index({ idDiario: 1, idSintoma: 1 }, { unique: true });

module.exports = mongoose.model('DiarioSintoma', diarioSintomaSchema);
