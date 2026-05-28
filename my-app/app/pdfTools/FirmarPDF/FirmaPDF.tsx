import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NadvarIndex from '@/components/NadvarIndex/NadvarIndex';

export default function FirmarPDF() {
  return (
    <View style={styles.container}>
      <NadvarIndex />
      <View style={styles.content}>
        <Text style={styles.title}>Firmar PDF</Text>
        <Text style={styles.description}>
          Firma tus documentos PDF de forma segura y profesional, con acceso directo desde la navegación.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 22,
  },
});
