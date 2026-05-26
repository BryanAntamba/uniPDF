import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import PasswordField from '@/components/auth/PasswordField';
import { registroStyles } from '@/styles/auth/RegistroUsuario';
import { validateLoginEmail, validatePassword } from '@/utils/validation';
import { isRegistered, registerUser } from '@/utils/authStore';

export default function RegistroUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = () => {
    const emailErr = validateLoginEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    if (isRegistered(email)) {
      setEmailError('Este correo ya está registrado.');
      return;
    }

    registerUser(email, password);
    Alert.alert('Registro exitoso', 'Tu cuenta fue creada. Ya puedes iniciar sesión.', [
      { text: 'Entrar', onPress: () => router.replace('/(auth)/Login') },
    ]);
  };

  return (
    <ScrollView style={registroStyles.container} contentContainerStyle={registroStyles.scrollContent}>
      <TouchableOpacity style={registroStyles.backLink} onPress={() => router.back()}>
        <Text style={registroStyles.backLinkText}>← Volver</Text>
      </TouchableOpacity>

      <View style={registroStyles.body}>
      <Text style={registroStyles.title}>Registrarse</Text>
      <Text style={registroStyles.subtitle}>
        Crea tu cuenta con un correo @gmail.com o @unipdf.com para usar las herramientas PDF.
      </Text>

      <View style={registroStyles.inputWrapper}>
        <TextInput
          style={[registroStyles.input, emailError ? registroStyles.inputError : null]}
          placeholder="Correo electrónico"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(null);
          }}
        />
        {emailError ? <Text style={registroStyles.fieldError}>{emailError}</Text> : null}
      </View>

      <PasswordField
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError(null);
        }}
        visible={showPassword}
        onToggleVisible={() => setShowPassword((v) => !v)}
        error={passwordError}
      />

      <TouchableOpacity style={registroStyles.button} onPress={handleRegister}>
        <Text style={registroStyles.buttonText}>Crear cuenta</Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
