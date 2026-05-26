import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { recuperacionStyles } from '@/styles/auth/RecuperacionContrasena';
import { validateGmailEmail } from '@/utils/validation';

export default function RecuperacionContrasena() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    const error = validateGmailEmail(email);
    setEmailError(error);
    if (error) return;

    router.push({
      pathname: '/(auth)/CodigoVerificacion',
      params: { email: email.trim().toLowerCase() },
    });
  };

  return (
    <ScrollView style={recuperacionStyles.container} contentContainerStyle={recuperacionStyles.scrollContent}>
      <TouchableOpacity style={recuperacionStyles.backLink} onPress={() => router.back()}>
        <Text style={recuperacionStyles.backLinkText}>← Volver</Text>
      </TouchableOpacity>

      <View style={recuperacionStyles.body}>
      <Text style={recuperacionStyles.title}>Recuperación contraseña</Text>
      <Text style={recuperacionStyles.subtitle}>
        Ingresa tu correo Gmail y te enviaremos un código de verificación de 6 dígitos.
      </Text>

      <View style={recuperacionStyles.inputWrapper}>
        <TextInput
          style={[recuperacionStyles.input, emailError ? recuperacionStyles.inputError : null]}
          placeholder="usuario@gmail.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(null);
          }}
        />
        {emailError ? <Text style={recuperacionStyles.fieldError}>{emailError}</Text> : null}
      </View>

      <TouchableOpacity style={recuperacionStyles.button} onPress={handleContinue}>
        <Text style={recuperacionStyles.buttonText}>Enviar código</Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
