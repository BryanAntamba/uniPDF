import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { codigoStyles } from '@/styles/auth/CodigoVerificacion';
import { validateVerificationCode } from '@/utils/validation';

export default function CodigoVerificacion() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const router = useRouter();

  const handleCodeChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 6);
    setCode(digitsOnly);
    if (codeError) setCodeError(null);
  };

  const handleContinue = () => {
    const error = validateVerificationCode(code);
    setCodeError(error);
    if (error) return;

    router.push({
      pathname: '/(auth)/cambiarContrasena',
      params: { email: email ?? '' },
    });
  };

  return (
    <ScrollView style={codigoStyles.container} contentContainerStyle={codigoStyles.scrollContent}>
      <TouchableOpacity style={codigoStyles.backLink} onPress={() => router.back()}>
        <Text style={codigoStyles.backLinkText}>← Volver</Text>
      </TouchableOpacity>

      <View style={codigoStyles.body}>
      <Text style={codigoStyles.title}>Código de verificación</Text>
      <Text style={codigoStyles.subtitle}>
        Revisa tu correo{email ? ` (${email})` : ''} e ingresa el código de 6 dígitos que recibiste.
      </Text>

      <View style={codigoStyles.inputWrapper}>
        <TextInput
          style={[
            codigoStyles.input,
            codigoStyles.codeInput,
            codeError ? codigoStyles.inputError : null,
          ]}
          placeholder="000000"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={handleCodeChange}
        />
        {codeError ? <Text style={codigoStyles.fieldError}>{codeError}</Text> : null}
      </View>

      <TouchableOpacity style={codigoStyles.button} onPress={handleContinue}>
        <Text style={codigoStyles.buttonText}>Verificar código</Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
