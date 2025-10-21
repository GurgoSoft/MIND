require('dotenv').config();
const db = require('../shared/config/database');
const Usuario = require('../shared/models/usuarios/Usuario');
const Persona = require('../shared/models/usuarios/Persona');
const TipoUsuario = require('../shared/models/usuarios/TipoUsuario');
const Estado = require('../shared/models/administrativo/Estado');

async function createFreshSuperAdmin() {
  try {
    await db.connect();
    console.log('🔧 Conectado a MongoDB');

    const newEmail = 'admin@mind.com';
    const newPassword = '123456';

    // 1. Eliminar usuario existente si existe
    console.log('🗑️ Eliminando usuario existente...');
    await Usuario.deleteOne({ email: newEmail });
    await Usuario.deleteOne({ email: 'superadmin@mind.com' });

    // 2. Buscar o crear TipoUsuario SUPERADMIN
    let tipoSuperAdmin = await TipoUsuario.findOne({ codigo: 'SUPERADMIN' });
    if (!tipoSuperAdmin) {
      tipoSuperAdmin = await TipoUsuario.create({
        codigo: 'SUPERADMIN',
        nombre: 'Super Administrador',
        descripcion: 'Acceso completo al sistema',
        activo: true
      });
    }

    // 3. Buscar estado activo
    let estadoActivo = await Estado.findOne({ codigo: '0001' });
    if (!estadoActivo) {
      estadoActivo = await Estado.create({
        codigo: '0001',
        nombre: 'Activo',
        descripcion: 'Estado activo',
        activo: true
      });
    }

    // 4. Crear nueva persona
    const nuevaPersona = await Persona.create({
      nombres: 'Admin',
      apellidos: 'Sistema',
      tipoDoc: 'CC',
      numDoc: '1234567890',
      fechaNacimiento: new Date('1990-01-01'),
      activo: true
    });

    // 5. Crear nuevo usuario SIN pepper (más simple)
    const nuevoUsuario = new Usuario({
      email: newEmail,
      passwordHash: newPassword, // Sin hashear por ahora
      idPersona: nuevaPersona._id,
      idTipoUsuario: tipoSuperAdmin._id,
      idEstado: estadoActivo._id,
      activo: true,
      verificado: true
    });

    // El pre-save del modelo se encargará de hashear con pepper
    await nuevoUsuario.save();

    console.log('✅ SuperAdmin creado exitosamente');
    console.log('📧 Email:', newEmail);
    console.log('🔑 Contraseña:', newPassword);
    console.log('👤 Persona:', nuevaPersona.nombres, nuevaPersona.apellidos);

    // 6. Verificar que funciona
    console.log('🧪 Probando login...');
    const loginTest = await Usuario.findOne({ email: newEmail });
    const passwordWorks = await loginTest.comparePassword(newPassword);
    console.log('✅ Test de contraseña:', passwordWorks ? 'FUNCIONA' : 'NO FUNCIONA');

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

createFreshSuperAdmin();