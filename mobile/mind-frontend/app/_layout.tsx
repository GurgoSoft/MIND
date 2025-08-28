// app/_layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade'
      }}
    >
      <Stack.Screen name="index" /> {/* Este será el splash */}
      <Stack.Screen name="home" />   {/*  pantalla principal */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}