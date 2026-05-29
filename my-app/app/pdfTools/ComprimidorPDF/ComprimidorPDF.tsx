import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function ComprimidorPDF() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<{
    porcentaje: number;
    pesoOriginal: number;
    pesoFinal: number;
    pdfUri: string;
  } | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

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
      setProgress(0);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const eliminarArchivo = () => {
    setSelectedFile(null);
    setResultado(null);
    setProgress(0);
    clearProgressTimer();
  };

  const comprimirPDF = async (archivo: any) => {
    try {
      setLoading(true);
      setResultado(null);
      setProgress(0);

      // Iniciar barra de progreso
      clearProgressTimer();
      progressTimer.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 2));
      }, 250);

      const formData = new FormData();
      formData.append('archivo', {
        uri: archivo.uri,
        name: archivo.name,
        type: 'application/pdf',
      } as any);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(buildApiUrl('/comprimir'), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timer);
      clearProgressTimer();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudo comprimir el archivo');
      }

      const data = await response.json();

      const urlPDF = buildApiUrl(`/temp/${data.nombre}`);
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

      setProgress(100);
      setTimeout(() => {
        setResultado({ porcentaje, pesoOriginal, pesoFinal, pdfUri });
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.log('ERROR GENERAL:', error);
      clearProgressTimer();
      setProgress(0);

      if (error?.name === 'AbortError') {
        Alert.alert('Error', 'La compresión tardó demasiado. Intenta de nuevo.');
      } else {
        Alert.alert('Error', error?.message || 'No se pudo comprimir el archivo');
      }
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    if (!resultado) return;
    
    // Generar nombre con "_comprimido"
    const nombreOriginal = selectedFile?.name || 'archivo.pdf';
    const nombreSinExtension = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
    const nombreFinal = `${nombreSinExtension}_comprimido.pdf`;
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resultado.pdfUri, {
        dialogTitle: 'Guardar PDF comprimido',
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Guardar PDF', `El archivo se guardó como: ${nombreFinal}`);
    }
  };

  return (
    <ScrollView style={comprimidorStyles.container} contentContainerStyle={comprimidorStyles.scrollContainer}>
      <NadvarIndex />
      <View style={comprimidorStyles.content}>
        {/* Solo mostrar icono, título y descripción cuando NO está cargando ni hay resultado */}
        {!loading && !resultado && (
          <>
            <MaterialIcons name="compress" size={80} color="#10b981" />
            <Text style={comprimidorStyles.title}>Comprimir PDF</Text>
            <Text style={comprimidorStyles.subtitle}>
              Reduce el tamaño de tus archivos PDF manteniendo la calidad óptima para compartir y almacenar
            </Text>
          </>
        )}

        {/* Archivo seleccionado - Solo mostrar si no está cargando ni hay resultado */}
        {selectedFile && !loading && !resultado && (
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
        )}

        {/* Barra de progreso durante la compresión */}
        {loading && (
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
                {progress}%
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>comprimiendo</Text>
            </View>
            <Text style={comprimidorStyles.subtitle}>
              Comprimiendo tu PDF, por favor espera...
            </Text>
          </View>
        )}

        {/* Resultado exitoso */}
        {resultado && !loading && (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
            {/* Ícono de éxito */}
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: '#10b98115',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <MaterialCommunityIcons name="check-circle" size={80} color="#10b981" />
            </View>

            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' }}>
              {resultado.porcentaje > 0 ? '¡Compresión exitosa!' : '¡Proceso completado!'}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              {resultado.porcentaje > 0 
                ? 'Tu PDF ha sido comprimido correctamente'
                : 'El archivo ya está optimizado, no se pudo reducir más su tamaño'}
            </Text>

            {/* Círculo con porcentaje de compresión */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 6,
                borderColor: '#ff4a36',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                backgroundColor: '#ff4a3610',
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4a36' }}>
                {resultado.porcentaje}%
              </Text>
              <Text style={{ fontSize: 11, color: '#666' }}>reducido</Text>
            </View>

            {/* Información de tamaños */}
            <View style={{ width: '100%', backgroundColor: '#f7f7f7', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#666', fontSize: 14 }}>Antes:</Text>
                <Text style={{ color: '#111', fontWeight: '700', fontSize: 14 }}>
                  {formatMB(resultado.pesoOriginal)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#666', fontSize: 14 }}>Después:</Text>
                <Text style={{ color: '#ff4a36', fontWeight: '700', fontSize: 14 }}>
                  {formatMB(resultado.pesoFinal)}
                </Text>
              </View>
            </View>

            {/* Botón descargar */}
            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDF}>
              <Text style={comprimidorStyles.buttonText}>Descargar PDF comprimido</Text>
            </TouchableOpacity>

            {/* Botón comprimir otro */}
            <TouchableOpacity 
              style={[comprimidorStyles.button, { backgroundColor: '#f3f4f6', marginTop: 12 }]} 
              onPress={eliminarArchivo}
            >
              <Text style={[comprimidorStyles.buttonText, { color: '#111' }]}>
                Comprimir otro PDF
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón principal */}
        {!loading && !resultado && (
          <TouchableOpacity
            style={comprimidorStyles.button}
            onPress={() => {
              if (selectedFile) {
                comprimirPDF(selectedFile);
              } else {
                seleccionarArchivo();
              }
            }}
          >
            <Text style={comprimidorStyles.buttonText}>
              {selectedFile ? 'Comprimir PDF' : 'Seleccionar PDF'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
