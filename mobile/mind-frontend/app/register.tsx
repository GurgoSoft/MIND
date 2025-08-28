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
  Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setBirthDate(currentDate);
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
              style={styles.input} 
              value={firstName}
              onChangeText={setFirstName}
            />
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
              style={styles.input} 
              value={firstLastName}
              onChangeText={setFirstLastName}
            />
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
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(birthDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={birthDate}
              mode="date"
              display="default"
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}

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
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          {/* Botón de Registro */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
        </ScrollView>
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
});