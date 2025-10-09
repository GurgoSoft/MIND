const mongoose = require('mongoose');

const tipoUsuarioSchema = new mongoose.Schema({
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
  collection: 'tipos_usuarios'
});

module.exports = mongoose.model('TipoUsuario', tipoUsuarioSchema);
