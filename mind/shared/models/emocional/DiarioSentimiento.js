const mongoose = require('mongoose');

const diarioSentimientoSchema = new mongoose.Schema({
  idDiario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diario',
    required: true
  },
  idSentimiento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sentimiento',
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
  collection: 'diarios_sentimientos'
});

diarioSentimientoSchema.index({ idDiario: 1, idSentimiento: 1 }, { unique: true });

module.exports = mongoose.model('DiarioSentimiento', diarioSentimientoSchema);
