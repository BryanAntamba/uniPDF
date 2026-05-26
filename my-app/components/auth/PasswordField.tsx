import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { authCommonStyles } from '@/styles/auth/common';

type PasswordFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  visible: boolean;
  onToggleVisible: () => void;
  error?: string | null;
};

export default function PasswordField({
  value,
  onChangeText,
  placeholder = 'Contraseña',
  visible,
  onToggleVisible,
  error,
}: PasswordFieldProps) {
  return (
    <View style={authCommonStyles.inputWrapper}>
      <View style={[authCommonStyles.passwordRow, error ? authCommonStyles.inputError : null]}>
        <TextInput
          style={authCommonStyles.passwordInput}
          placeholder={placeholder}
          secureTextEntry={!visible}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
        />
        <TouchableOpacity style={authCommonStyles.eyeButton} onPress={onToggleVisible}>
          <FontAwesome name={visible ? 'eye' : 'eye-slash'} size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      {error ? <Text style={authCommonStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}
