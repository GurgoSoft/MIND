import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Aquí puedes agregar la lógica de autenticación
    console.log("Login con:", email, password);
  };

  return (
    <LinearGradient 
      colors={["#A398F0", "#A398F0", "#6AB0D2"]} 
      style={styles.container}
    >
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
                style={styles.input} 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña*</Text>
              <TextInput 
                style={styles.input} 
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Botón de Ingreso */}
            <TouchableOpacity 
              style={styles.button}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Ingresar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
});