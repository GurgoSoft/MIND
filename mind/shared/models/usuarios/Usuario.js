const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const usuarioSchema = new mongoose.Schema({
  idPersona: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true,
    unique: true
  },
  idTipoUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoUsuario',
    required: true
  },
  idEstado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estado',
    required: false,
    default: null
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefono: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido']
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaUltimoAcceso: {
    type: Date
  },
  intentosFallidos: {
    type: Number,
    default: 0
  },
  bloqueado: {
    type: Boolean,
    default: false
  },
  fechaBloqueo: {
    type: Date
  },
  // Campos para verificación de email
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    select: false // No incluir en consultas por defecto por seguridad
  },
  verificationCodeExpires: {
    type: Date,
    select: false // No incluir en consultas por defecto por seguridad
  }
}, {
  timestamps: true,
  collection: 'usuarios'
});

// Hash password before saving
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const pepper = process.env.PASSWORD_PEPPER || '';
    
    // Add pepper to password for extra security
    const pepperedPassword = this.passwordHash + pepper;
    
    const salt = await bcrypt.genSalt(saltRounds);
    this.passwordHash = await bcrypt.hash(pepperedPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
  const pepper = process.env.PASSWORD_PEPPER || '';
  const pepperedPassword = candidatePassword + pepper;
  return bcrypt.compare(pepperedPassword, this.passwordHash);
};

// Update last access
usuarioSchema.methods.updateLastAccess = function() {
  this.fechaUltimoAcceso = new Date();
  this.intentosFallidos = 0;
  return this.save();
};

// Increment failed attempts
usuarioSchema.methods.incrementFailedAttempts = function() {
  this.intentosFallidos += 1;
  if (this.intentosFallidos >= 5) {
    this.bloqueado = true;
    this.fechaBloqueo = new Date();
  }
  return this.save();
};

usuarioSchema.index({ email: 1 });
usuarioSchema.index({ idPersona: 1 });

module.exports = mongoose.model('Usuario', usuarioSchema);
