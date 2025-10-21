require('dotenv').config();
const bcrypt = require('bcryptjs');

async function testHashing() {
  try {
    const password = 'Admin123!';
    const pepper = process.env.PASSWORD_PEPPER || '';
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    
    console.log('🔑 Password original:', password);
    console.log('🌶️ Pepper:', pepper);
    console.log('🔐 Password con pepper:', password + pepper);
    console.log('🧂 Salt rounds:', saltRounds);
    
    // Generar hash
    const pepperedPassword = password + pepper;
    const hash = await bcrypt.hash(pepperedPassword, saltRounds);
    console.log('🔐 Hash generado:', hash);
    
    // Comparar inmediatamente
    const isValid = await bcrypt.compare(pepperedPassword, hash);
    console.log('✅ Comparación inmediata:', isValid);
    
    // Simular como lo hace el modelo
    const testPepperedPassword = password + pepper;
    const isValid2 = await bcrypt.compare(testPepperedPassword, hash);
    console.log('✅ Comparación simulada:', isValid2);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testHashing();