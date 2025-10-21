require('dotenv').config();
const db = require('../shared/config/database');
const Usuario = require('../shared/models/usuarios/Usuario');
const Persona = require('../shared/models/usuarios/Persona');
const bcrypt = require('bcryptjs');

async function resetSuperAdminPassword() {
  try {
    await db.connect();
    console.log('🔧 Conectado a MongoDB para resetear contraseña del SuperAdmin');

    const email = process.env.SUPERADMIN_EMAIL || 'admin@mind.com';
    const newPassword = process.env.SUPERADMIN_PASSWORD || 'Admin123!';

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email }).populate('idPersona');
    
    if (!usuario) {
      console.log('❌ No se encontró usuario con email:', email);
      console.log('📝 Usuarios existentes:');
      const usuarios = await Usuario.find({}).populate('idPersona').select('email idPersona');
      usuarios.forEach(u => {
        console.log(`   - ${u.email} (Persona: ${u.idPersona?.nombres || 'N/A'} ${u.idPersona?.apellidos || ''})`);
      });
      process.exit(1);
    }

    // Hashear nueva contraseña con pepper
    const pepper = process.env.PASSWORD_PEPPER || '';
    const pepperedPassword = newPassword + pepper;
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(pepperedPassword, saltRounds);
    
    // Actualizar contraseña
    usuario.passwordHash = hashedPassword;
    usuario.activo = true;
    
    await usuario.save();
    
    console.log('✅ Contraseña del SuperAdmin actualizada exitosamente');
    console.log('📧 Email:', email);
    console.log('🔑 Nueva contraseña:', newPassword);
    console.log('👤 Usuario:', usuario.idPersona?.nombres, usuario.idPersona?.apellidos);

    await db.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
    try {
      await db.disconnect();
    } catch {}
    process.exit(1);
  }
}

resetSuperAdminPassword();