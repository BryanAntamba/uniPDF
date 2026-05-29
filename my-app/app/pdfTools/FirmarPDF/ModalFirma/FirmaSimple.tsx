import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { firmaSimpleStyles } from '@/styles/styleModalFirma/FirmaSimple';
import { validarNombre, validarIniciales } from '@/utils/ValidacionModalFirma/FirmaSimpleValidacion';

type FirmaSimpleProps = {
  onClose: () => void;
  onAplicar: (texto: string, estilo: number) => void;
  firmaInicial?: string;
  estiloInicial?: number;
};

// Estilos de firma disponibles
const ESTILOS_FIRMA = [
  { id: 0, nombre: 'Clásica', fontFamily: 'cursive', fontSize: 24, fontStyle: 'italic' as const },
  { id: 1, nombre: 'Elegante', fontFamily: 'serif', fontSize: 26, fontStyle: 'italic' as const },
  { id: 2, nombre: 'Moderna', fontFamily: 'sans-serif', fontSize: 22, fontStyle: 'normal' as const },
  { id: 3, nombre: 'Manuscrita', fontFamily: 'monospace', fontSize: 20, fontStyle: 'italic' as const },
  { id: 4, nombre: 'Formal', fontFamily: 'serif', fontSize: 24, fontStyle: 'normal' as const },
  { id: 5, nombre: 'Casual', fontFamily: 'sans-serif', fontSize: 23, fontStyle: 'italic' as const },
];

export default function FirmaSimple({
  onClose,
  onAplicar,
  estiloInicial = 0,
}: FirmaSimpleProps) {
  const [nombre, setNombre] = useState('');
  const [iniciales, setIniciales] = useState('');
  const [estiloSeleccionado, setEstiloSeleccionado] = useState(estiloInicial);
  const [errorNombre, setErrorNombre] = useState('');
  const [errorIniciales, setErrorIniciales] = useState('');

  // Determinar qué texto mostrar en las firmas
  const textoFirma = nombre.trim() || iniciales.trim() || 'Tu firma';

  const handleNombreChange = (texto: string) => {
    const resultado = validarNombre(texto);
    setNombre(resultado.texto);
    setErrorNombre(resultado.error);
  };

  const handleInicialesChange = (texto: string) => {
    const resultado = validarIniciales(texto);
    setIniciales(resultado.texto);
    setErrorIniciales(resultado.error);
  };

  const handleAplicar = () => {
    // Validar que al menos uno de los campos tenga contenido
    if (!nombre.trim() && !iniciales.trim()) {
      setErrorNombre('Debes ingresar un nombre o iniciales');
      return;
    }

    // Si hay errores, no aplicar
    if (errorNombre || errorIniciales) {
      return;
    }

    // Aplicar la firma con el texto y estilo seleccionado
    onAplicar(textoFirma, estiloSeleccionado);
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={firmaSimpleStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={firmaSimpleStyles.modalContainer}>
        {/* Header */}
        <View style={firmaSimpleStyles.header}>
          <Text style={firmaSimpleStyles.headerTitle}>Crear Firma Simple</Text>
          <TouchableOpacity onPress={onClose} style={firmaSimpleStyles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={firmaSimpleStyles.content} showsVerticalScrollIndicator={false}>
          {/* Campos de entrada */}
          <View style={firmaSimpleStyles.inputSection}>
            {/* Campo Nombre */}
            <View style={firmaSimpleStyles.inputContainer}>
              <Text style={firmaSimpleStyles.inputLabel}>Nombre o nombre completo</Text>
              <TextInput
                value={nombre}
                onChangeText={handleNombreChange}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor="#9ca3af"
                style={[
                  firmaSimpleStyles.input,
                  errorNombre ? firmaSimpleStyles.inputError : {},
                ]}
                autoCapitalize="words"
              />
              {errorNombre ? (
                <Text style={firmaSimpleStyles.errorText}>{errorNombre}</Text>
              ) : null}
            </View>

            {/* Campo Iniciales */}
            <View style={firmaSimpleStyles.inputContainer}>
              <Text style={firmaSimpleStyles.inputLabel}>Iniciales</Text>
              <TextInput
                value={iniciales}
                onChangeText={handleInicialesChange}
                placeholder="Ej: JP"
                placeholderTextColor="#9ca3af"
                style={[
                  firmaSimpleStyles.input,
                  errorIniciales ? firmaSimpleStyles.inputError : {},
                ]}
                autoCapitalize="characters"
                maxLength={5}
              />
              {errorIniciales ? (
                <Text style={firmaSimpleStyles.errorText}>{errorIniciales}</Text>
              ) : null}
            </View>
          </View>

          {/* Lista de estilos de firma */}
          <View style={firmaSimpleStyles.estilosSection}>
            <Text style={firmaSimpleStyles.estilosTitle}>
              Selecciona un estilo de firma
            </Text>
            <Text style={firmaSimpleStyles.estilosSubtitle}>
              {textoFirma === 'Tu firma'
                ? 'Escribe tu nombre o iniciales para ver los estilos'
                : 'Toca un estilo para seleccionarlo'}
            </Text>

            {ESTILOS_FIRMA.map((estilo) => (
              <TouchableOpacity
                key={estilo.id}
                onPress={() => setEstiloSeleccionado(estilo.id)}
                style={[
                  firmaSimpleStyles.estiloItem,
                  estiloSeleccionado === estilo.id && firmaSimpleStyles.estiloItemSelected,
                ]}
              >
                {/* Checkbox */}
                <View style={firmaSimpleStyles.checkboxContainer}>
                  <View
                    style={[
                      firmaSimpleStyles.checkbox,
                      estiloSeleccionado === estilo.id && firmaSimpleStyles.checkboxSelected,
                    ]}
                  >
                    {estiloSeleccionado === estilo.id && (
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                    )}
                  </View>
                </View>

                {/* Vista previa de la firma */}
                <View style={firmaSimpleStyles.firmaPreview}>
                  <Text
                    style={{
                      fontFamily: estilo.fontFamily,
                      fontSize: estilo.fontSize,
                      fontStyle: estilo.fontStyle,
                      color: '#ff4a36',
                    }}
                  >
                    {textoFirma}
                  </Text>
                  <Text style={firmaSimpleStyles.estiloNombre}>
                    {estilo.nombre} - {estilo.fontFamily} {estilo.fontStyle === 'italic' ? '(Cursiva)' : '(Normal)'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer con botones */}
        <View style={firmaSimpleStyles.footer}>
          <TouchableOpacity
            onPress={onClose}
            style={[firmaSimpleStyles.button, firmaSimpleStyles.buttonCancelar]}
          >
            <Text style={firmaSimpleStyles.buttonCancelarText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAplicar}
            style={[firmaSimpleStyles.button, firmaSimpleStyles.buttonAplicar]}
            disabled={!nombre.trim() && !iniciales.trim()}
          >
            <Text style={firmaSimpleStyles.buttonAplicarText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}
