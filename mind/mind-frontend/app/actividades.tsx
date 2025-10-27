import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ActividadesScreen() {
  return (
    <LinearGradient colors={["#859CE8", "#6AB0D2"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
      <View style={styles.centerBox}>
        <MaterialCommunityIcons name="meditation" size={64} color="#fff" />
        <Text style={styles.title}>Actividades sensoriales</Text>
        <Text style={styles.subtitle}>En construcción</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 10 },
  subtitle: { color: "#fff", opacity: 0.85, marginTop: 6 },
});
