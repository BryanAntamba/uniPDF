import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PasswordField from '@/components/auth/PasswordField';
import { cambiarContrasenaStyles } from '@/styles/auth/CambiarContrasena';
import { validatePassword, validateConfirmPassword } from '@/utils/validation';
import { getStoredPassword, updatePassword } from '@/utils/authStore';

export default function CambiarContrasena() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const router = useRouter();

  const handleConfirm = () => {
    const pwdError = validatePassword(password);
    const confirmPwdError = validateConfirmPassword(password, confirmPassword);
    setPasswordError(pwdError);
    setConfirmError(confirmPwdError);

    if (pwdError || confirmPwdError) return;

    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const currentPassword = getStoredPassword(normalizedEmail);

    if (currentPassword && password === currentPassword) {
      setPasswordError('La nueva contraseña no puede ser igual a la anterior.');
      return;
    }

    if (normalizedEmail) {
      updatePassword(normalizedEmail, password);
    }

    Alert.alert('Éxito', 'Su contraseña fue cambiada exitosamente.', [
      {
        text: 'Iniciar sesión',
        onPress: () => router.replace('/(auth)/Login'),
      },
    ]);
  };

  return (
    <ScrollView
      style={cambiarContrasenaStyles.container}
      contentContainerStyle={cambiarContrasenaStyles.scrollContent}
    >
      <TouchableOpacity style={cambiarContrasenaStyles.backLink} onPress={() => router.back()}>
        <Text style={cambiarContrasenaStyles.backLinkText}>← Volver</Text>
      </TouchableOpacity>

      <View style={cambiarContrasenaStyles.body}>
      <Text style={cambiarContrasenaStyles.title}>Cambiar contraseña</Text>
      <Text style={cambiarContrasenaStyles.subtitle}>
        Crea una nueva contraseña segura. No puede ser igual a tu contraseña anterior.
      </Text>

      <PasswordField
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError(null);
        }}
        placeholder="Nueva contraseña"
        visible={showPassword}
        onToggleVisible={() => setShowPassword((v) => !v)}
        error={passwordError}
      />

      <PasswordField
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (confirmError) setConfirmError(null);
        }}
        placeholder="Confirmar contraseña"
        visible={showConfirmPassword}
        onToggleVisible={() => setShowConfirmPassword((v) => !v)}
        error={confirmError}
      />

      <TouchableOpacity style={cambiarContrasenaStyles.button} onPress={handleConfirm}>
        <Text style={cambiarContrasenaStyles.buttonText}>Confirmar contraseña</Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
