const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configuración para Gmail  
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'notificacionesvisoftware@gmail.com',
        pass: process.env.EMAIL_PASS || 'iosk qsur debw czar'
      }
    });
  }

  async sendVerificationCode(email, code, userName = '') {
    try {
      const mailOptions = {
        from: {
          name: 'MIND App',  
          address: process.env.EMAIL_USER || 'notificacionesvisoftware@gmail.com'
        },
        to: email,
        subject: '🔐 Código de Verificación - MIND App',
        html: this.getVerificationEmailTemplate(code, userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error enviando correo:', error);
      throw error;
    }
  }

  getVerificationEmailTemplate(code, userName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #859CE8, #6AB0D2);
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .header {
                background: linear-gradient(135deg, #859CE8, #6AB0D2);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            .code-container {
                background: #f8f9fa;
                border: 2px dashed #859CE8;
                border-radius: 10px;
                padding: 25px;
                margin: 30px 0;
                display: inline-block;
            }
            .verification-code {
                font-size: 36px;
                font-weight: bold;
                color: #7675DD;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🧠 MIND</div>
                <p>Verificación de Cuenta</p>
            </div>
            
            <div class="content">
                <h2>¡Hola${userName ? ` ${userName}` : ''}! 👋</h2>
                <p>Hemos recibido tu solicitud de registro en MIND App. Para completar la verificación de tu cuenta, utiliza el siguiente código:</p>
                
                <div class="code-container">
                    <div class="verification-code">${code}</div>
                </div>
                
                <p><strong>Instrucciones:</strong></p>
                <p>1. Ve a la app MIND</p>
                <p>2. Ingresa este código de 6 dígitos</p>
                <p>3. ¡Listo! Tu cuenta estará activada</p>
                
                <div class="warning">
                    ⚠️ <strong>Importante:</strong> Este código expira en <strong>15 minutos</strong> por seguridad.
                </div>
                
                <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
            </div>
            
            <div class="footer">
                <p>© 2025 MIND App. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Conexión SMTP verificada exitosamente');
      return true;
    } catch (error) {
      console.error('Error en conexión SMTP:', error);
      return false;
    }
  }
}

module.exports = new EmailService();