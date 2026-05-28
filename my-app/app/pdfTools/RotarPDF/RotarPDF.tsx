import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import NadvarIndex from '@/components/NadvarIndex/NadvarIndex';
import { comprimidorStyles } from '@/styles/pdfTools/ComprimirPDF';
import { buildApiUrl } from '@/constants/config';

const formatMB = (bytes: number) => {
  if (!bytes || !Number.isFinite(bytes)) return '— MB';
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const getFileSize = async (uri: string): Promise<number> => {
  const info = await FileSystem.getInfoAsync(uri);
  return (info as { size?: number }).size ?? 0;
};

export default function RotarPDF() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [rotacion, setRotacion] = useState<90 | 180 | 270>(90);
  const [resultado, setResultado] = useState<{
    pdfUri: string;
    tamanio: number;
  } | null>(null);

  const seleccionarArchivo = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (r.canceled) {
        setSelectedFile(null);
        return;
      }

      const asset = r.assets[0];
      const size = asset.size || (await getFileSize(asset.uri));
      setSelectedFile({ ...asset, size });
      setResultado(null);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const eliminarArchivo = () => {
    setSelectedFile(null);
    setResultado(null);
  };

  const rotarPDF = async (archivo: any) => {
    try {
      setLoading(true);
      setResultado(null);

      // TODO: Implementar endpoint /rotar en el backend
      Alert.alert(
        'Función en desarrollo',
        `La rotación de PDFs estará disponible próximamente. Se rotará ${rotacion}° en sentido horario.`
      );
      
      setLoading(false);
      
      // Código de ejemplo para cuando esté el endpoint:
      /*
      const formData = new FormData();
      formData.append('archivo', {
        uri: archivo.uri,
        name: archivo.name,
        type: 'application/pdf',
      } as any);
      formData.append('rotacion', rotacion.toString());

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(buildApiUrl('/rotar'), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudo rotar el archivo');
      }

      const data = await response.json();
      const urlPDF = buildApiUrl(`/temp/${data.nombre}`);
      const pdfUri = FileSystem.documentDirectory + 'archivo_rotado.pdf';
      await FileSystem.downloadAsync(urlPDF, pdfUri);

      setResultado({ pdfUri, tamanio: data.tamanio });
      */
    } catch (error: any) {
      console.log('ERROR GENERAL:', error);
      if (error?.name === 'AbortError') {
        Alert.alert('Error', 'La rotación tardó demasiado. Intenta de nuevo.');
      } else {
        Alert.alert('Error', error?.message || 'No se pudo rotar el archivo');
      }
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    if (!resultado) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resultado.pdfUri, {
        dialogTitle: 'Guardar PDF rotado',
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Guardar PDF', `El archivo se guardó en: ${resultado.pdfUri}`);
    }
  };

  return (
    <ScrollView style={comprimidorStyles.container} contentContainerStyle={comprimidorStyles.scrollContainer}>
      <NadvarIndex />
      <View style={comprimidorStyles.content}>
        <MaterialCommunityIcons name="rotate-right" size={80} color="#ff4a36" />
        <Text style={comprimidorStyles.title}>Rotar PDF</Text>
        <Text style={comprimidorStyles.subtitle}>Rota las páginas de tu PDF en el ángulo deseado</Text>

        {selectedFile && !resultado && (
          <>
            <View style={[comprimidorStyles.fileContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={comprimidorStyles.fileText}>Archivo seleccionado:</Text>
                <Text style={comprimidorStyles.fileName} numberOfLines={1} ellipsizeMode="tail">
                  {selectedFile.name}
                </Text>
                <Text style={comprimidorStyles.fileSize}>Tamaño: {formatMB(selectedFile.size)}</Text>
              </View>
              <TouchableOpacity onPress={eliminarArchivo} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#ff4a36' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ width: '100%', marginTop: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12, textAlign: 'center' }}>
                Selecciona el ángulo de rotación:
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                {[90, 180, 270].map((grados) => (
                  <TouchableOpacity
                    key={grados}
                    onPress={() => setRotacion(grados as 90 | 180 | 270)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      backgroundColor: rotacion === grados ? '#ff4a36' : '#f3f4f6',
                      borderWidth: 2,
                      borderColor: rotacion === grados ? '#ff4a36' : '#e5e7eb',
                    }}
                  >
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '700', 
                      color: rotacion === grados ? '#ffffff' : '#111' 
                    }}>
                      {grados}°
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {resultado && !loading && (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
            <View style={{ width: '100%', backgroundColor: '#f7f7f7', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: '#111', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
                ✅ PDF rotado exitosamente
              </Text>
              <Text style={{ color: '#666', fontSize: 14 }}>
                Tamaño: {formatMB(resultado.tamanio)}
              </Text>
            </View>

            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDF}>
              <Text style={comprimidorStyles.buttonText}>Descargar PDF rotado</Text>
            </TouchableOpacity>
          </View>
        )}

        {!resultado && (
          <TouchableOpacity
            style={comprimidorStyles.button}
            onPress={() => {
              if (selectedFile) {
                rotarPDF(selectedFile);
              } else {
                seleccionarArchivo();
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="large" />
            ) : (
              <Text style={comprimidorStyles.buttonText}>
                {selectedFile ? 'Rotar PDF' : 'Seleccionar PDF'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
