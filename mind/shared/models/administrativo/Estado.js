const mongoose = require('mongoose');

const estadoSchema = new mongoose.Schema({
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
  },
  color: {
    type: String,
    required: false,
    trim: true,
    default: '#6AB9D2'
  },
  simbolo: {
    type: String,
    required: false,
    trim: true,
    maxlength: 5
  },
  descripcion: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  visible: {
    type: Boolean,
    required: false,
    default: true
  },
  modulo: {
    type: String,
    required: false,
    trim: true,
    default: 'TODOS'
  }
}, {
  timestamps: true,
  collection: 'estados'
});

module.exports = mongoose.model('Estado', estadoSchema);
