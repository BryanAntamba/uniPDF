import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
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

// Extensiones soportadas
const EXTENSIONES_SOPORTADAS = [
  // Documentos Office
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Documentos de texto
  '.txt', '.rtf', '.odt',
  // Imágenes
  '.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.tif', '.webp',
  // Notebooks
  '.ipynb',
];

export default function ConvertidorPDF() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<{
    pdfUri: string;
    tamanio: number;
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
        type: '*/*', // Aceptar cualquier tipo de archivo
        copyToCacheDirectory: true,
      });

      if (r.canceled) {
        setSelectedFile(null);
        return;
      }

      const asset = r.assets[0];
      const ext = asset.name.substring(asset.name.lastIndexOf('.')).toLowerCase();
      
      // Validar extensión
      if (!EXTENSIONES_SOPORTADAS.includes(ext)) {
        Alert.alert(
          'Formato no soportado',
          `El archivo ${ext} no es compatible. Formatos soportados:\n\n` +
          '• Documentos: .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .rtf, .odt\n' +
          '• Imágenes: .jpg, .jpeg, .png, .bmp, .gif, .tiff, .webp\n' +
          '• Notebooks: .ipynb'
        );
        return;
      }

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

  const convertirPDF = async (archivo: any) => {
    try {
      setLoading(true);
      setResultado(null);
      setProgress(0);

      // Iniciar barra de progreso
      clearProgressTimer();
      progressTimer.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 3));
      }, 200);

      const formData = new FormData();
      
      // Determinar el tipo MIME del archivo
      const ext = archivo.name.substring(archivo.name.lastIndexOf('.')).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.bmp') mimeType = 'image/bmp';
      else if (['.tiff', '.tif'].includes(ext)) mimeType = 'image/tiff';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === '.doc') mimeType = 'application/msword';
      else if (ext === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (ext === '.xls') mimeType = 'application/vnd.ms-excel';
      else if (ext === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (ext === '.ppt') mimeType = 'application/vnd.ms-powerpoint';
      else if (ext === '.txt') mimeType = 'text/plain';
      else if (ext === '.ipynb') mimeType = 'application/x-ipynb+json';

      formData.append('archivo', {
        uri: archivo.uri,
        name: archivo.name,
        type: mimeType,
      } as any);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(buildApiUrl('/convertir'), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timer);
      clearProgressTimer();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudo convertir el archivo');
      }

      const data = await response.json();

      const urlPDF = buildApiUrl(`/temp/${data.nombre}`);
      const pdfUri = FileSystem.documentDirectory + 'archivo_convertido.pdf';
      await FileSystem.downloadAsync(urlPDF, pdfUri);

      const tamanio = data.tamanio || (await getFileSize(pdfUri));
      
      setProgress(100);
      setTimeout(() => {
        setResultado({ pdfUri, tamanio });
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.log('ERROR GENERAL:', error);
      clearProgressTimer();
      setProgress(0);
      
      if (error?.name === 'AbortError') {
        Alert.alert('Error', 'La conversión tardó demasiado. Intenta de nuevo.');
      } else {
        Alert.alert('Error', error?.message || 'No se pudo convertir el archivo');
      }
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    if (!resultado) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resultado.pdfUri, {
        dialogTitle: 'Guardar PDF convertido',
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
        <MaterialCommunityIcons name="file-pdf-box" size={80} color="#ff4a36" />
        <Text style={comprimidorStyles.title}>Convertir a PDF</Text>
        <Text style={comprimidorStyles.subtitle}>
          Convierte documentos, imágenes y notebooks a PDF
        </Text>

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

        {/* Barra de progreso durante la conversión */}
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
              <Text style={{ fontSize: 12, color: '#666' }}>convirtiendo</Text>
            </View>
            <Text style={comprimidorStyles.subtitle}>
              Convirtiendo tu archivo a PDF, por favor espera...
            </Text>
          </View>
        )}

        {/* Resultado exitoso */}
        {resultado && !loading && (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
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
              ¡Conversión exitosa!
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              Tu archivo ha sido convertido a PDF correctamente
            </Text>

            <View style={{ width: '100%', backgroundColor: '#f7f7f7', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#666', fontSize: 14 }}>Archivo original:</Text>
                <Text style={{ color: '#111', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                  {selectedFile?.name}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#666', fontSize: 14 }}>Tamaño PDF:</Text>
                <Text style={{ color: '#ff4a36', fontWeight: '700', fontSize: 14 }}>
                  {formatMB(resultado.tamanio)}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDF}>
              <Text style={comprimidorStyles.buttonText}>Descargar PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[comprimidorStyles.button, { backgroundColor: '#f3f4f6', marginTop: 12 }]} 
              onPress={eliminarArchivo}
            >
              <Text style={[comprimidorStyles.buttonText, { color: '#111' }]}>
                Convertir otro archivo
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
                convertirPDF(selectedFile);
              } else {
                seleccionarArchivo();
              }
            }}
          >
            <Text style={comprimidorStyles.buttonText}>
              {selectedFile ? 'Convertir a PDF' : 'Seleccionar Archivo'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Formatos soportados */}
        {!selectedFile && !loading && !resultado && (
          <View style={{ marginTop: 24, width: '100%' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 12, textAlign: 'center' }}>
              Formatos soportados:
            </Text>
            <View style={{ backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 13, color: '#666', lineHeight: 20 }}>
                <Text style={{ fontWeight: '700' }}>• Documentos:</Text> Word, Excel, PowerPoint, TXT, RTF{'\n'}
                <Text style={{ fontWeight: '700' }}>• Imágenes:</Text> JPG, PNG, BMP, GIF, TIFF, WebP{'\n'}
                <Text style={{ fontWeight: '700' }}>• Notebooks:</Text> Jupyter (.ipynb)
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
