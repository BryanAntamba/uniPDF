import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import NadvarIndex from '@/components/NadvarIndex/NadvarIndex';
import { comprimidorStyles } from '@/styles/pdfTools/ComprimirPDF';

const getBackendHost = () => '192.168.70.122';

const formatMB = (bytes: number) => {
  if (!bytes || !Number.isFinite(bytes)) return '— MB';
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const getFileSize = async (uri: string): Promise<number> => {
  const info = await FileSystem.getInfoAsync(uri);
  return (info as { size?: number }).size ?? 0;
};

export default function ConvertidorPDF() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [resultado, setResultado] = useState<{
    porcentaje: number;
    pesoOriginal: number;
    pesoFinal: number;
    pdfUri: string;
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

  const comprimirPDF = async (archivo: any) => {
    try {
      setLoading(true);
      setResultado(null);

      const formData = new FormData();
      formData.append('archivo', {
        uri: archivo.uri,
        name: archivo.name,
        type: 'application/pdf',
      } as any);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`http://${getBackendHost()}:3000/comprimir`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudo comprimir el archivo');
      }

      const data = await response.json();

      const urlPDF = `http://${getBackendHost()}:3000/temp/${data.nombre}`;
      const pdfUri = FileSystem.documentDirectory + 'archivo_comprimido.pdf';
      await FileSystem.downloadAsync(urlPDF, pdfUri);

      const pesoOriginal = data.tamanioOriginal ?? archivo.size ?? (await getFileSize(archivo.uri));
      const pesoFinal = data.tamanioComprimido ?? data.tamanio ?? 0;
      const porcentaje =
        typeof data.porcentaje === 'number'
          ? data.porcentaje
          : pesoOriginal > 0
            ? Math.max(0, Math.round(((pesoOriginal - pesoFinal) / pesoOriginal) * 100))
            : 0;

      setResultado({ porcentaje, pesoOriginal, pesoFinal, pdfUri });
    } catch (error: any) {
      console.log('ERROR GENERAL:', error);
      if (error?.name === 'AbortError') {
        Alert.alert('Error', 'La compresión tardó demasiado. Intenta de nuevo.');
      } else {
        Alert.alert('Error', error?.message || 'No se pudo comprimir el archivo');
      }
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    if (!resultado) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resultado.pdfUri, {
        dialogTitle: 'Guardar PDF comprimido',
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
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/337/337946.png' }} style={comprimidorStyles.logo} />
        <Text style={comprimidorStyles.title}>PDF Compressor</Text>
        <Text style={comprimidorStyles.subtitle}>Reduce el tamaño de tus PDFs sin perder calidad</Text>

        {selectedFile && !resultado && (
          <View style={[comprimidorStyles.fileContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={comprimidorStyles.fileText}>Archivo seleccionado:</Text>
              <Text style={comprimidorStyles.fileName} numberOfLines={1} ellipsizeMode="tail">
                {selectedFile.name}
              </Text>
              <Text style={comprimidorStyles.fileSize}>Antes: {formatMB(selectedFile.size)}</Text>
            </View>
            <TouchableOpacity onPress={eliminarArchivo} style={{ padding: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#ff4a36' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {resultado && !loading && (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                borderWidth: 8,
                borderColor: '#ff4a36',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#ff4a36' }}>
                {resultado.porcentaje}%
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>comprimido</Text>
            </View>

            <View style={{ width: '100%', backgroundColor: '#f7f7f7', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#666', fontSize: 14 }}>Antes:</Text>
                <Text style={{ color: '#111', fontWeight: '700', fontSize: 14 }}>{formatMB(resultado.pesoOriginal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#666', fontSize: 14 }}>Después:</Text>
                <Text style={{ color: '#ff4a36', fontWeight: '700', fontSize: 14 }}>{formatMB(resultado.pesoFinal)}</Text>
              </View>
            </View>

            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDF}>
              <Text style={comprimidorStyles.buttonText}>Descargar PDF comprimido</Text>
            </TouchableOpacity>
          </View>
        )}

        {!resultado && (
          <TouchableOpacity
            style={comprimidorStyles.button}
            onPress={() => {
              if (selectedFile) {
                comprimirPDF(selectedFile);
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
                {selectedFile ? 'Comprimir PDF' : 'Seleccionar PDF'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
