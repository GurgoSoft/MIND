const mongoose = require('mongoose');

const diarioEmocionSchema = new mongoose.Schema({
  idDiario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diario',
    required: true
  },
  idEmocion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emocion',
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
  collection: 'diarios_emociones'
});

diarioEmocionSchema.index({ idDiario: 1, idEmocion: 1 }, { unique: true });

module.exports = mongoose.model('DiarioEmocion', diarioEmocionSchema);
