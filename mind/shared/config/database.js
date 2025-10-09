const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if (this.connection && this.connection.readyState === 1) {
        console.log(' Ya existe una conexión activa a MongoDB');
        return this.connection;
      }

      const mongoUri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DB_NAME || 'local';

      if (!mongoUri) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }

      const options = {
        dbName: dbName,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        autoIndex: process.env.NODE_ENV !== 'production'
      };

      this.connection = await mongoose.connect(mongoUri, options);

      console.log(` Conectado exitosamente a MongoDB: ${dbName}`);
      
      // Event listeners
      mongoose.connection.on('error', (error) => {
        console.error(' Error de conexión MongoDB:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log(' Desconectado de MongoDB');
      });

      mongoose.connection.on('reconnected', () => {
        console.log(' Reconectado a MongoDB');
      });

      return this.connection;
    } catch (error) {
      console.error(' Error conectando a MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        console.log(' Desconectado de MongoDB');
      }
    } catch (error) {
      console.error(' Error desconectando de MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

//  shutdown db conection when app is terminated
process.on('SIGINT', async () => {
  console.log('\n Cerrando aplicación...');
  try {
    await mongoose.disconnect();
    console.log(' Conexión MongoDB cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error(' Error cerrando conexión:', error);
    process.exit(1);
  }
});

module.exports = new Database();
