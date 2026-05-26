import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import PasswordField from '@/components/auth/PasswordField';
import { loginStyles } from '@/styles/auth/Login';
import { validateLoginEmail, validatePassword } from '@/utils/validation';
import { isRegistered, verifyCredentials } from '@/utils/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = () => {
    const emailErr = validateLoginEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setLoginError(null);

    if (emailErr || passwordErr) return;

    if (!isRegistered(email)) {
      setLoginError('Este correo no está registrado. Regístrate para continuar.');
      return;
    }

    if (!verifyCredentials(email, password)) {
      setLoginError('Correo o contraseña incorrectos.');
      return;
    }

    Alert.alert('Bienvenido', 'Inicio de sesión exitoso');
    router.push('/');
  };

  return (
    <ScrollView style={loginStyles.container} contentContainerStyle={loginStyles.scrollContent}>
      <TouchableOpacity style={loginStyles.backLink} onPress={() => router.back()}>
        <Text style={loginStyles.backLinkText}>← Volver</Text>
      </TouchableOpacity>

      <View style={loginStyles.body}>
      <Text style={loginStyles.title}>Iniciar Sesión</Text>
      <Text style={loginStyles.subtitle}>Ingresa tus datos para acceder a las herramientas PDF.</Text>

      <View style={loginStyles.inputWrapper}>
        <TextInput
          style={[loginStyles.input, emailError ? loginStyles.inputError : null]}
          placeholder="Correo electrónico"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(null);
            if (loginError) setLoginError(null);
          }}
        />
        {emailError ? <Text style={loginStyles.fieldError}>{emailError}</Text> : null}
      </View>

      <PasswordField
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError(null);
          if (loginError) setLoginError(null);
        }}
        visible={showPassword}
        onToggleVisible={() => setShowPassword((v) => !v)}
        error={passwordError}
      />

      <TouchableOpacity style={loginStyles.button} onPress={handleLogin}>
        <Text style={loginStyles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      {loginError ? <Text style={loginStyles.loginError}>{loginError}</Text> : null}

      <View style={loginStyles.linksRow}>
        <TouchableOpacity
          style={loginStyles.link}
          onPress={() => router.push('/(auth)/RecuperacionContrasena')}
        >
          <Text style={loginStyles.linkText}>¿Olvidé la contraseña?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={loginStyles.link}
          onPress={() => router.push('/(auth)/RegistroUsuario')}
        >
          <Text style={loginStyles.linkText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );
}
