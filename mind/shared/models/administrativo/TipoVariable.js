const mongoose = require('mongoose');

const tipoVariableSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'tipos_variables'
});

module.exports = mongoose.model('TipoVariable', tipoVariableSchema);
