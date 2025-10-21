import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sendVerificationEmail, verifyRegistrationCode } from '../services/api';
import { saveToken } from '../services/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyRegistration() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const usuarioId = typeof params.usuarioId === 'string' ? params.usuarioId : undefined;

  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Efecto para manejar el contador de reenvío
  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSendEmail = async () => {
    if (!usuarioId) {
      console.log('❌ Usuario no identificado en verificación');
      setStatusMsg('Usuario no identificado. Por favor inicia sesión o reintenta.');
      return;
    }
    
    console.log('📧 Iniciando envío de código de verificación');
    console.log('👤 Usuario ID:', usuarioId);
    
    setSendingEmail(true);
    setStatusMsg(null);
    try {
      console.log('📨 Enviando código via servicio de usuarios...');
      const result = await sendVerificationEmail(usuarioId);
      console.log('✅ Código enviado:', result);
      
      setEmailSent(true);
      setShowCodeInput(true);
      // Sin mensaje molesto, solo cambio de estado
      
      // Iniciar contador de reenvío (60 segundos)
      setResendCooldown(60);
      setCanResend(false);
      
      // Habilitar reenvío después del cooldown inicial
      setTimeout(() => {
        setCanResend(true);
      }, 60000);
      
    } catch (err: any) {
      console.log('❌ Error enviando código:', err);
      const msg = err?.payload?.message || err?.message || 'Error enviando código de verificación';
      setStatusMsg(`❌ ${msg}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || resendCooldown > 0) return;
    
    console.log('Reenviando código de verificación...');
    setSendingEmail(true);
    setStatusMsg(null);
    setCodeError('');
    
    try {
      const result = await sendVerificationEmail(usuarioId!);
      console.log('Código reenviado:', result);
      
      // Sin mensaje molesto, solo notificación discreta
      
      // Reiniciar contador de reenvío
      setResendCooldown(60);
      setCanResend(false);
      
    } catch (err: any) {
      console.log('Error reenviando código:', err);
      const msg = err?.payload?.message || err?.message || 'Error reenviando código';
      setStatusMsg(`❌ ${msg}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!usuarioId || !verificationCode.trim()) {
      setCodeError('Por favor ingresa el código de verificación');
      return;
    }

    if (verificationCode.length !== 6) {
      setCodeError('El código debe tener 6 dígitos');
      return;
    }

    console.log('Verificando código:', verificationCode);
    setVerifyingCode(true);
    setCodeError('');
    setStatusMsg(null);

    try {
      const result = await verifyRegistrationCode(usuarioId, verificationCode);
      console.log('Código verificado exitosamente:', result);

      // Guardar token si se recibe
      if (result?.data?.token) {
        await saveToken(result.data.token);
        console.log('Token guardado - usuario logueado automáticamente');
      }

      // Mostrar modal de éxito en lugar de mensaje feo
      setShowSuccessModal(true);
      
      // Redirigir después de un momento
      setTimeout(() => {
        setShowSuccessModal(false);
        router.replace('/mainMenu');
      }, 2000);

    } catch (err: any) {
      console.log('Error verificando código:', err);
      const msg = err?.payload?.message || err?.message || 'Código inválido';
      if (msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('incorrecto')) {
        setCodeError('Código incorrecto. Verifica e intenta nuevamente.');
      } else {
        setCodeError(msg);
      }
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <LinearGradient 
      colors={["#859CE8", "#6AB0D2"]} 
      style={styles.container}
    >
      {/* Botón Back */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 32 }]}
        onPress={() => router.replace('/home')}
        accessibilityLabel="Volver"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/MINDLOGO_BLUE.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>Verificar Registro</Text>
          
          {/* Mensaje principal */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Hemos guardado tus datos de forma satisfactoria.
            </Text>
            
            <Text style={styles.message}>
              Para asegurarnos de que los datos que proporcionaste son verdaderos solicitamos que por favor nos colabores con una validación adicional.
            </Text>
            
            <Text style={styles.message}>
              Por lo que te invitamos a dar click en el botón "Enviar código", para enviar un código de verificación a tu correo electrónico.
            </Text>
            
            <Text style={styles.message}>
              Ingresa el código de 6 dígitos que recibas para confirmar tu registro.
            </Text>
            
            <Text style={styles.bulletPoint}>
              • Al verificar tu código también nos autorizas el uso de los datos proporcionados en el formulario anterior, tales como: nombre, correo electrónico y fecha de nacimiento, esto con fin de dar cumplimiento a la ley 1581 de 2012.
            </Text>
          </View>

          {/* Botón de envío */}
          {!showCodeInput && (
            <TouchableOpacity 
              style={[styles.button, (sendingEmail || emailSent) && styles.buttonDisabled]} 
              onPress={handleSendEmail}
              disabled={sendingEmail || emailSent}
            >
              {sendingEmail ? (
                <ActivityIndicator color="#fff" />
              ) : emailSent ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Código Enviado</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Enviar código</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Input para código de verificación */}
          {showCodeInput && (
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>Ingresa el código de 6 dígitos que recibiste por correo:</Text>
              
              <TextInput
                style={[styles.codeInput, !!codeError && styles.inputError]}
                value={verificationCode}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setVerificationCode(cleaned);
                  setCodeError('');
                }}
                placeholder="123456"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
              />
              
              {!!codeError && <Text style={styles.errorText}>{codeError}</Text>}
              
              <TouchableOpacity 
                style={[styles.button, styles.verifyButton]} 
                onPress={handleVerifyCode}
                disabled={verifyingCode || verificationCode.length !== 6}
              >
                {verifyingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verificar Código</Text>
                )}
              </TouchableOpacity>

              {/* Sección de reenvío */}
              <View style={styles.resendSection}>
                <Text style={styles.resendInfo}>
                  ¿No recibiste el código?
                </Text>
                
                {resendCooldown > 0 ? (
                  <Text style={styles.cooldownText}>
                    Podrás reenviar en {resendCooldown} segundos
                  </Text>
                ) : (
                  <TouchableOpacity 
                    style={[styles.resendButton, !canResend && styles.resendButtonDisabled]} 
                    onPress={handleResendCode}
                    disabled={!canResend || sendingEmail}
                  >
                    {sendingEmail ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.resendText}>Reenviar código</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de éxito elegante */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.checkIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>¡Verificación Exitosa!</Text>
            <Text style={styles.modalMessage}>
              Tu cuenta ha sido verificada correctamente.{'\n'}
              Serás redirigido automáticamente...
            </Text>
            <ActivityIndicator 
              size="small" 
              color="#7675DD" 
              style={styles.modalLoader}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    padding: 10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: 30, 
    textAlign: 'center',
    color: '#fff',
  },
  messageContainer: {
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  message: { 
    fontSize: 16, 
    color: '#fff', 
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'left',
    lineHeight: 20,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  button: { 
    backgroundColor: '#7675DD', 
    paddingVertical: 15, 
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: '600',
    fontSize: 16,
  },
  codeSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  codeLabel: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    marginBottom: 10,
    minWidth: 200,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  verifyButton: {
    marginTop: 10,
    minWidth: '90%', // Hacer el botón más alargado
    alignSelf: 'center',
  },
  resendSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendInfo: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  cooldownText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resendButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Estilos del modal elegante
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 280,
  },
  checkIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalLoader: {
    marginTop: 10,
  },
});