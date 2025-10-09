
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');

function readEnvFile() {
  try {
    return fs.readFileSync(ENV_FILE, 'utf8');
  } catch (error) {
    console.error(' Error leyendo archivo .env:', error.message);
    process.exit(1);
  }
}

function writeEnvFile(content) {
  try {
    fs.writeFileSync(ENV_FILE, content, 'utf8');
  } catch (error) {
    console.error(' Error escribiendo archivo .env:', error.message);
    process.exit(1);
  }
}

function toggleJWT(enable) {
  let envContent = readEnvFile();
  const jwtDisabledRegex = /JWT_DISABLED=.*/;
  
  if (jwtDisabledRegex.test(envContent)) {
    envContent = envContent.replace(jwtDisabledRegex, `JWT_DISABLED=${!enable}`);
  } else {
    envContent += `\nJWT_DISABLED=${!enable}`;
  }
  
  writeEnvFile(envContent);
  
  if (enable) {
    console.log(' JWT Authentication ACTIVADO');
    console.log('  - Todos los endpoints requieren token JWT válido');
    console.log('  - Usa POST /api/auth/login para obtener token');
  } else {
    console.log(' JWT Authentication DESACTIVADO');
    console.log('  - Todos los endpoints son accesibles sin token');
    console.log('  - Perfecto para testing inicial y creación de datos');
  }
}

function showStatus() {
  const envContent = readEnvFile();
  const match = envContent.match(/JWT_DISABLED=(.*)/);
  const isDisabled = match ? match[1].trim() === 'true' : false;
  
  console.log(' Estado actual del JWT:');
  console.log(`  JWT Authentication: ${isDisabled ? ' DESACTIVADO' : ' ACTIVADO'}`);
  
  if (isDisabled) {
    console.log(' Modo desarrollo - Sin autenticación requerida');
  } else {
    console.log(' Modo producción - Autenticación requerida');
  }
}


const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'disable':
  case 'off':
    toggleJWT(false);
    break;
  case 'enable':
  case 'on':
    toggleJWT(true);
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log(' JWT Toggle Utility');
    console.log('');
    console.log('Uso:');
    console.log('  node jwt-toggle.js disable  # Desactivar JWT (para testing)');
    console.log('  node jwt-toggle.js enable   # Activar JWT (para producción)');
    console.log('  node jwt-toggle.js status   # Ver estado actual');
    console.log('');
    console.log('Aliases:');
    console.log('  disable = off');
    console.log('  enable = on');
    break;
}
