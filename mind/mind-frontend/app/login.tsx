import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router"; 
import { login as apiLogin, trackAdminAudit } from "../services/api";
import { saveToken } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter(); 
  const insets = useSafeAreaInsets();
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setToken } = useAuth();

  const handleLogin = async () => {
    let hasError = false;
    if (!email) {
      setEmailError('El correo es obligatorio.');
      hasError = true;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Correo inválido.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('La contraseña es obligatoria.');
      hasError = true;
    }
    if (hasError) return;
    setLoading(true);
    try {
      const res = await apiLogin(email.trim(), password);
      const token = res.data?.token;
      if (!token) throw new Error('No se recibió token');
  await saveToken(token);
  await setToken(token);
      // Registrar auditoría de acceso en administración (no bloquear si falla)
      try {
        const userId = res.data?.usuario?._id;
        if (userId) {
          await trackAdminAudit({
            entidad: 'Usuario',
            idEntidad: userId,
            accion: 'LOGIN',
            datosNuevos: { loginTime: new Date().toISOString() },
          });
        }
      } catch (e) {
        // Silencioso
      }
      // Redirección según rol
      const roleCode = res.data?.usuario?.tipoUsuario?.codigo?.toUpperCase?.();
      if (roleCode === 'SUPERADMIN' || roleCode === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/mainMenu');
      }
    } catch (err: any) {
      const status = err?.status;
      let msg = err?.payload?.message || err?.message || 'Error al iniciar sesión';
      if (status === 401) {
        msg = 'Correo o contraseña inválidos.';
        setEmailError(' ');
        setPasswordError('Correo o contraseña inválidos.');
      }
      setErrorTitle('Inicio de sesión');
      setErrorMessage(msg);
      setErrorVisible(true);
    } finally {
      setLoading(false);
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
              {/*  logo como imagen */}
              { <Image 
                source={require('../assets/MINDLOGO_BLUE.png')} 
                style={styles.logo}
                resizeMode="contain"
              /> }
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Correo electrónico */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico*</Text>
              <TextInput 
                style={[styles.input, !!emailError && styles.inputError]} 
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña*</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={[styles.input, { paddingRight: 52 }]} 
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.passwordToggle}
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.8}
                >
                  <View style={styles.passwordToggleInner}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#ffffff" />
                  </View>
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              {/* Olvidé contraseña */}
              <View style={styles.linkLeftRow}>
                <Text style={styles.linkCta} onPress={() => router.push('/forgotPassword')}>Olvidé mi contraseña</Text>
              </View>
            </View>

            {/* Botón de Ingreso */}
            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Ingresar</Text>
              )}
            </TouchableOpacity>

            {/* Enlace a Registro */}
            <View style={styles.linkLeftRow}>
              <Text style={styles.linkText}>¿No tienes una cuenta? </Text>
              <Text style={styles.linkCta} onPress={() => router.push('/register')}>Regístrate</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      {/* Modal de Error */}
      <Modal visible={errorVisible} transparent animationType="fade" onRequestClose={() => setErrorVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{errorTitle}</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setErrorVisible(false)}>
              <Text style={styles.buttonText}>Entendido</Text>
            </TouchableOpacity>
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
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logo: {
    width: 250,
    height: 250,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    padding: 15,
    borderRadius: 25,
    color: "#fff",
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff0000ff',
  },
  errorText: {
    color: '#ff0000ff',
    marginTop: 6,
    marginLeft: 12,
    fontSize: 12,
  },
  button: {
    backgroundColor: "#7675DD",
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    padding: 10,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordToggle: {
    position: 'absolute',
    right: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggleInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255,255,255,0.9)',
  },
  linkCta: {
    color: '#ffffff',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  linkLeftRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#2E3A59',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalText: { color: '#fff', lineHeight: 20, marginBottom: 12 },
});