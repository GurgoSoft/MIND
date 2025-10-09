import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

// Componente del logo MIND
const MindLogo = () => (
  <View style={styles.logoContainer}>
      <Image 
        source={require('../assets/MINDLOGO_BLUE.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
);

export default function Home() {
  const [pressedButton, setPressedButton] = useState<null | 'login' | 'register'>(null);

  const handlePressIn = (buttonName: 'login' | 'register') => {
    setPressedButton(buttonName);
  };

  const handlePressOut = () => {
    setPressedButton(null);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient 
        colors={["#859CE8", "#6AB0D2"]} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Logo MIND */}
        <MindLogo />

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button, 
              pressedButton === 'login' && styles.buttonPressed
            ]}
            onPress={() => router.push("/login")}
            onPressIn={() => handlePressIn('login')}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Text style={[
              styles.buttonText,
              pressedButton === 'login' && styles.buttonTextPressed
            ]}>
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              pressedButton === 'register' && styles.buttonPressed
            ]}
            onPress={() => router.push("/register")}
            onPressIn={() => handlePressIn('register')}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Text style={[
              styles.buttonText,
              pressedButton === 'register' && styles.buttonTextPressed
            ]}>
              Register
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              console.log("Términos y condiciones presionado");
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.terms}>Términos & Condiciones</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  logoContainer: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    marginTop: 300,
    width: 350,
    height: 350,
  },
  buttonContainer: {
    flex: 1.5,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
    paddingTop: 250,
    paddingBottom: 80,
  },
  button: {
    backgroundColor: "#7675DD",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  buttonPressed: {
    backgroundColor: "#2EC0F9", 
  },
  buttonTextPressed: {
    color: "#000",
  },
  terms: {
    marginTop: 16,
    color: "#000",
    fontSize: 14,
    textDecorationLine: "none",
    opacity: 0.8,
  },
});