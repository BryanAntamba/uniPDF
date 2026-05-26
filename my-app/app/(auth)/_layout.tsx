import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" />
      <Stack.Screen name="RegistroUsuario" />
      <Stack.Screen name="RecuperacionContrasena" />
      <Stack.Screen name="CodigoVerificacion" />
      <Stack.Screen name="cambiarContrasena" />
    </Stack>
  );
}
