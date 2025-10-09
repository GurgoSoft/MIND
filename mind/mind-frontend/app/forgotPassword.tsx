import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { forgotPassword } from '../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Requerido', 'Por favor ingresa tu correo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert('Correo inválido', 'Ingresa un correo válido.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(trimmed);
      Alert.alert('Enviado', 'Si el correo existe, te enviaremos instrucciones para restablecer tu contraseña.');
      router.back();
    } catch (err: any) {
      const msg = err?.payload?.message || err?.message || 'No fue posible procesar tu solicitud';
      Alert.alert('Recuperar contraseña', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#859CE8", "#6AB0D2"]} style={styles.container}>
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 32 }]}
        onPress={() => router.replace('/login')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>Ingresa tu correo y te enviaremos instrucciones para restablecerla.</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico*</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar instrucciones</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { position: 'absolute', left: 12, zIndex: 10, padding: 10 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.9)', marginBottom: 24 },
  inputContainer: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, marginBottom: 8, marginLeft: 5 },
  input: { borderWidth: 1, borderColor: '#fff', padding: 15, borderRadius: 25, color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#7675DD', paddingVertical: 15, borderRadius: 25, marginTop: 10, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
