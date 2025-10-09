const mongoose = require('mongoose');

const ciudadSchema = new mongoose.Schema({
  idDepartamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Departamento',
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
  collection: 'ciudades'
});

ciudadSchema.index({ idDepartamento: 1 });

module.exports = mongoose.model('Ciudad', ciudadSchema);
