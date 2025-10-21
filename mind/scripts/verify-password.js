require('dotenv').config();
const db = require('../shared/config/database');
const Usuario = require('../shared/models/usuarios/Usuario');
const bcrypt = require('bcryptjs');

async function verifyPassword() {
  try {
    await db.connect();
    console.log('🔧 Conectado a MongoDB para verificar contraseña');

    const email = 'superadmin@mind.com';
    const password = 'Admin123!';

    // Buscar usuario
    const usuario = await Usuario.findOne({ email });
    
    if (!usuario) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log('👤 Usuario encontrado:', email);
    console.log('🔑 Password hash en DB:', usuario.passwordHash);
    
    // Verificar con pepper
    const pepper = process.env.PASSWORD_PEPPER || '';
    console.log('🌶️ Pepper configurado:', pepper ? 'SÍ' : 'NO');
    console.log('🌶️ Pepper value:', pepper);
    
    const pepperedPassword = password + pepper;
    console.log('🔐 Password con pepper:', pepperedPassword);
    
    // Comparar manualmente
    const isValid = await bcrypt.compare(pepperedPassword, usuario.passwordHash);
    console.log('✅ Contraseña válida (manual):', isValid);
    
    // Comparar usando el método del modelo
    const isValidMethod = await usuario.comparePassword(password);
    console.log('✅ Contraseña válida (método):', isValidMethod);

    await db.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    try {
      await db.disconnect();
    } catch {}
    process.exit(1);
  }
}

verifyPassword();