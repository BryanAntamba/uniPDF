import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NadvarIndex from '@/components/NadvarIndex/NadvarIndex';

export default function UnionPDF() {
  return (
    <View style={styles.container}>
      <NadvarIndex />
      <View style={styles.content}>
        <Text style={styles.title}>Unir PDF</Text>
        <Text style={styles.description}>
          Junta varios documentos en un único PDF listo para descargar o compartir.
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
