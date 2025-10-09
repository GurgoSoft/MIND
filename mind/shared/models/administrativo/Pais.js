const mongoose = require('mongoose');

const paisSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  codigoISO: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  }
}, {
  timestamps: true,
  collection: 'paises'
});

module.exports = mongoose.model('Pais', paisSchema);
