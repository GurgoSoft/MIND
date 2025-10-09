const mongoose = require('mongoose');

const departamentoSchema = new mongoose.Schema({
  idPais: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pais',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  codigoDANE: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'departamentos'
});

departamentoSchema.index({ idPais: 1 });

module.exports = mongoose.model('Departamento', departamentoSchema);
