import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { register as apiRegister } from "../services/api";
import { router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [dateStep, setDateStep] = useState<'year' | 'month' | 'day'>('year');
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<number | null>(null); // 1-12
  const [tempDay, setTempDay] = useState<number | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [docNumberError, setDocNumberError] = useState('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const monthsEs = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];
  const today = new Date();
  const clampToMax = (y: number, m: number, d: number) => {
    const selected = new Date(y, m - 1, d);
    return selected > today ? today : selected;
  };
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const isFutureMonth = (y: number, m: number) => y === today.getFullYear() && m > (today.getMonth() + 1);
  const isFutureDay = (y: number, m: number, d: number) => y === today.getFullYear() && m === (today.getMonth() + 1) && d > today.getDate();
  const openDateModal = () => {
    // Prefijar con la fecha actual seleccionada
    setTempYear(birthDate.getFullYear());
    setTempMonth(birthDate.getMonth() + 1);
    setTempDay(birthDate.getDate());
    setDateStep('year');
    setShowCustomDatePicker(true);
  };
  const confirmTempDate = () => {
    if (!tempYear || !tempMonth || !tempDay) return;
    const final = clampToMax(tempYear, tempMonth, tempDay);
    setBirthDate(final);
    setShowCustomDatePicker(false);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [msgVisible, setMsgVisible] = useState(false);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const insets = useSafeAreaInsets();

  // Errores inline por campo
  const [firstNameError, setFirstNameError] = useState('');
  const [firstLastNameError, setFirstLastNameError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');

  const handleRegister = async () => {
    // Reset errores
    setFirstNameError('');
    setFirstLastNameError('');
    setBirthDateError('');
    setDocNumberError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');

    let hasError = false;
    if (!firstName) { setFirstNameError('El primer nombre es obligatorio.'); hasError = true; }
    if (!firstLastName) { setFirstLastNameError('El primer apellido es obligatorio.'); hasError = true; }
    if (!birthDate) { setBirthDateError('La fecha de nacimiento es obligatoria.'); hasError = true; }
    else if (new Date(birthDate).getTime() > Date.now()) { setBirthDateError('La fecha no puede ser futura.'); hasError = true; }
  if (!docNumber.trim()) { setDocNumberError('El número de documento es obligatorio.'); hasError = true; }
    if (!email) { setEmailError('El correo es obligatorio.'); hasError = true; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Correo inválido.'); hasError = true; }
    if (!password) { setPasswordError('La contraseña es obligatoria.'); hasError = true; }
    else if (password.length < 6) { setPasswordError('Mínimo 6 caracteres.'); hasError = true; }
    if (!confirmPassword) { setConfirmPasswordError('Confirma tu contraseña.'); hasError = true; }
    else if (password !== confirmPassword) { setConfirmPasswordError('Las contraseñas no coinciden.'); hasError = true; }
    if (!termsAccepted) { setTermsError('Debes aceptar los Términos y Condiciones.'); hasError = true; }

    if (hasError) return;
    // Backend espera persona.nombres, apellidos, numDoc, fechaNacimiento ISO, y usuario.passwordHash
    const payload = {
      persona: {
        nombres: `${firstName}${secondName ? ' ' + secondName : ''}`.trim(),
        apellidos: `${firstLastName}${secondLastName ? ' ' + secondLastName : ''}`.trim(),
        tipoDoc: 'CC',
        numDoc: docNumber.trim(),
        fechaNacimiento: new Date(birthDate).toISOString(),
      },
      usuario: {
        email: email.trim(),
        passwordHash: password,
      },
    };

    setLoading(true);
    try {
      await apiRegister(payload as any);
      setMsgTitle('Registro exitoso');
      setMsgBody('Ahora puedes iniciar sesión.');
      setMsgVisible(true);
    } catch (err: any) {
      const status = err?.status;
      let msg = err?.payload?.message || err?.message || 'Error al registrar';
      if (status === 400) {
        // Mapear errores de validación del backend a errores inline
        const backendErrors = err?.payload?.errors;
        if (Array.isArray(backendErrors)) {
          backendErrors.forEach((e: any) => {
            const field = e?.field || '';
            if (field === 'persona.numDoc') setDocNumberError('El número de documento es obligatorio.');
            if (field === 'persona.fechaNacimiento') setBirthDateError('Fecha de nacimiento inválida.');
            if (field === 'usuario.email') setEmailError('Correo inválido.');
            if (field === 'usuario.passwordHash') setPasswordError('Mínimo 6 caracteres.');
            if (field === 'persona.nombres') setFirstNameError('El primer nombre es obligatorio.');
            if (field === 'persona.apellidos') setFirstLastNameError('El primer apellido es obligatorio.');
          });
          // Mostrar primer mensaje específico si existe
          const first = backendErrors[0];
          if (first?.message) msg = first.message;
        }
        // Mensajes conocidos
        if (/email ya est[aá] registrado/i.test(msg)) {
          msg = 'El correo ya está registrado. Intenta iniciar sesión o usa otro correo.';
        } else if (/persona.*documento|ya existe una persona/i.test(msg)) {
          msg = 'Ya existe una persona con este documento.';
        } else if (msg === 'Datos de entrada inválidos' && docNumber.trim() === '') {
          msg = 'Completa el Número de Documento.';
        }
      }
      setMsgTitle('Registro');
      setMsgBody(msg);
      setMsgVisible(true);
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/MINDLOGO_BLUE.png')}
                style={styles.logo}
                resizeMode="contain"
              />
          </View>

          {/* Título */}
          <Text style={styles.title}>Registro a la aplicación</Text>
          <Text style={styles.subtitle}>Los campos con (*) son obligatorios</Text>

          {/* Primer Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Primer Nombre*</Text>
            <TextInput 
              style={[styles.input, !!firstNameError && styles.inputError]} 
              value={firstName}
              onChangeText={(t) => { setFirstName(t); setFirstNameError(''); }}
            />
            {!!firstNameError && <Text style={styles.errorText}>{firstNameError}</Text>}
          </View>

          {/* Segundo Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Segundo Nombre</Text>
            <TextInput 
              style={styles.input} 
              value={secondName}
              onChangeText={setSecondName}
            />
          </View>

          {/* Primer Apellido */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Primer Apellido*</Text>
            <TextInput 
              style={[styles.input, !!firstLastNameError && styles.inputError]} 
              value={firstLastName}
              onChangeText={(t) => { setFirstLastName(t); setFirstLastNameError(''); }}
            />
            {!!firstLastNameError && <Text style={styles.errorText}>{firstLastNameError}</Text>}
          </View>

          {/* Segundo Apellido */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Segundo Apellido</Text>
            <TextInput 
              style={styles.input} 
              value={secondLastName}
              onChangeText={setSecondLastName}
            />
          </View>

          {/* Fecha de Nacimiento */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fecha Nacimiento*</Text>
            <TouchableOpacity 
              style={[styles.dateInput, !!birthDateError && styles.inputError]}
              onPress={openDateModal}
            >
              <Text style={styles.dateText}>{formatDate(birthDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            {!!birthDateError && <Text style={styles.errorText}>{birthDateError}</Text>}
          </View>

          {/* Modal selector de fecha personalizado (ES) */}
          <Modal visible={showCustomDatePicker} transparent animationType="fade" onRequestClose={() => setShowCustomDatePicker(false)}>
            <View style={styles.modalBackdrop}>
              {/* Cerrar al tocar fuera */}
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCustomDatePicker(false)} />
              <View style={styles.modalCard}>
                {/* Botón X de cierre */}
                <TouchableOpacity onPress={() => setShowCustomDatePicker(false)} style={styles.modalClose} accessibilityLabel="Cerrar selector de fecha">
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Selecciona tu fecha de nacimiento</Text>
                {/* Pasos */}
                <View style={styles.stepRow}>
                  <Text style={[styles.step, dateStep === 'year' && styles.stepActive]}>Año</Text>
                  <Text style={styles.stepSeparator}>›</Text>
                  <Text style={[styles.step, dateStep === 'month' && styles.stepActive]}>Mes</Text>
                  <Text style={styles.stepSeparator}>›</Text>
                  <Text style={[styles.step, dateStep === 'day' && styles.stepActive]}>Día</Text>
                </View>

                {/* Contenido por paso */}
                {dateStep === 'year' && (
                  <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={styles.gridWrap}>
                    {Array.from({ length: 120 }).map((_, idx) => {
                      const year = today.getFullYear() - idx; // desde actual hacia atrás
                      return (
                        <TouchableOpacity
                          key={year}
                          style={[styles.gridItem, tempYear === year && styles.gridItemActive]}
                          onPress={() => { setTempYear(year); setDateStep('month'); }}
                        >
                          <Text style={styles.gridText}>{year}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {dateStep === 'month' && (
                  <View>
                    <ScrollView style={{ maxHeight: 260 }}>
                      <View style={styles.monthsWrap}>
                      {monthsEs.map((m, i) => {
                        const monthNumber = i + 1;
                        const disabled = isFutureMonth(tempYear, monthNumber);
                        return (
                          <TouchableOpacity
                            key={m}
                            disabled={disabled}
                            style={[styles.monthItem, tempMonth === monthNumber && styles.gridItemActive, disabled && styles.disabledItem]}
                            onPress={() => { setTempMonth(monthNumber); setDateStep('day'); }}
                          >
                            <Text style={styles.gridText}>{m}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      </View>
                    </ScrollView>
                    <View style={styles.modalActionsRow}>
                      <TouchableOpacity onPress={() => setDateStep('year')}><Text style={styles.linkCta}>Atrás</Text></TouchableOpacity>
                    </View>
                  </View>
                )}

                {dateStep === 'day' && tempMonth && (
                  <View>
                    <ScrollView style={{ maxHeight: 260 }}>
                      <View style={styles.daysWrap}>
                      {Array.from({ length: daysInMonth(tempYear, tempMonth) }).map((_, i) => {
                        const d = i + 1;
                        const disabled = isFutureDay(tempYear, tempMonth!, d);
                        return (
                          <TouchableOpacity
                            key={d}
                            disabled={disabled}
                            style={[styles.dayItem, tempDay === d && styles.gridItemActive, disabled && styles.disabledItem]}
                            onPress={() => {
                              setTempDay(d);
                              const final = clampToMax(tempYear, tempMonth!, d);
                              setBirthDate(final);
                              setShowCustomDatePicker(false);
                            }}
                          >
                            <Text style={styles.gridText}>{d.toString().padStart(2,'0')}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      </View>
                    </ScrollView>
                    <View style={styles.modalActionsRow}>
                      <TouchableOpacity onPress={() => setDateStep('month')}><Text style={styles.linkCta}>Atrás</Text></TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Confirmar global */}
                <TouchableOpacity
                  style={[styles.button, { marginTop: 16, opacity: !(tempYear && tempMonth && tempDay) ? 0.6 : 1 }]}
                  onPress={confirmTempDate}
                  disabled={!(tempYear && tempMonth && tempDay)}
                >
                  <Text style={styles.buttonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Documento */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número de Documento*</Text>
            <TextInput 
              style={[styles.input, !!docNumberError && styles.inputError]} 
              value={docNumber}
              onChangeText={(t) => { setDocNumber(t); setDocNumberError(''); }}
              keyboardType="numeric"
            />
            {!!docNumberError && <Text style={styles.errorText}>{docNumberError}</Text>}
          </View>

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
                style={[styles.input, { paddingRight: 52 }, !!passwordError && styles.inputError]} 
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                secureTextEntry={!showPassword}
                placeholderTextColor="rgba(255,255,255,0.5)"
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
          </View>

          {/* Confirmar Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Contraseña*</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={[styles.input, { paddingRight: 52 }, !!confirmPasswordError && styles.inputError]} 
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setConfirmPasswordError(''); }}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(v => !v)}
                style={styles.passwordToggle}
                accessibilityLabel={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.8}
              >
                <View style={styles.passwordToggleInner}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>
            {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
          </View>

          {/* Términos y Condiciones */}
          <View style={styles.termsRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setTermsAccepted(v => !v)}
              accessibilityLabel={termsAccepted ? 'Desmarcar términos' : 'Aceptar términos'}
            >
              {termsAccepted && <Ionicons name="checkmark" size={18} color="#2A2A2A" />}
            </TouchableOpacity>
            <Text style={styles.termsTextWrap}>
              Acepto los <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>Términos y Condiciones</Text>
            </Text>
          </View>
          {!!termsError && <Text style={styles.errorText}>{termsError}</Text>}

          {/* Botón de Registro */}
          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrar</Text>
            )}
          </TouchableOpacity>

          {/* Enlace a Login */}
          <View style={styles.linkLeftRow}>
            <Text style={styles.linkText}>¿Ya tienes una cuenta? </Text>
            <Text style={styles.linkCta} onPress={() => router.replace('/login')}>Inicia sesión</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Términos */}
      <Modal visible={showTerms} transparent animationType="fade" onRequestClose={() => setShowTerms(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Términos y Condiciones</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={styles.modalText}>
                Este texto es de ejemplo para los términos y condiciones.
              </Text>
            </ScrollView>
            <TouchableOpacity style={[styles.button, { marginTop: 16 }]} onPress={() => setShowTerms(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Mensajes (éxito/error) */}
      <Modal visible={msgVisible} transparent animationType="fade" onRequestClose={() => setMsgVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{msgTitle}</Text>
            <Text style={styles.modalText}>{msgBody}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                const wasSuccess = msgTitle.toLowerCase().includes('exitoso');
                setMsgVisible(false);
                if (wasSuccess) router.replace('/login');
              }}
            >
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 130,
    height: 130,
  },
  title: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#fff", 
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#fff",
    textAlign: "left",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    padding: 12,
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
  dateInput: {
    borderWidth: 1,
    borderColor: "#fff",
    padding: 12,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    color: "#fff"
  },
  button: {
    backgroundColor: "#7675DD",
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
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
  linkLeftRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    color: 'rgba(255,255,255,0.9)',
  },
  linkCta: {
    color: '#ffffff',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  termsRow: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsTextWrap: {
    color: 'rgba(255,255,255,0.9)',
    flexShrink: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: '#ffffff',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
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
    maxWidth: 480,
    alignSelf: 'center',
    position: 'relative'
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    color: '#fff',
    lineHeight: 20,
  },
  // Date picker custom styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  step: {
    color: '#fff',
    fontWeight: '600',
  },
  stepActive: {
    textDecorationLine: 'underline',
  },
  stepSeparator: {
    color: '#fff',
    marginHorizontal: 8,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 4,
    alignItems: 'center',
  },
  gridItemActive: {
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  gridText: {
    color: '#fff',
    fontWeight: '600'
  },
  monthsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '48%',
    paddingVertical: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayItem: {
    width: '18%',
    paddingVertical: 10,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  disabledItem: {
    opacity: 0.45,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  }
});