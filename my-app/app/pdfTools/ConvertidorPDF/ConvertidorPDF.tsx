import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import NadvarIndex from '@/components/NavbarUsuario/NavbarUsuario';
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
        type: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'application/rtf',
          'application/vnd.oasis.opendocument.text',
          'image/*',
          'application/x-ipynb+json'
        ], // Bloquea archivos PDF a nivel de selector nativo del sistema
        copyToCacheDirectory: true,
      });

      if (r.canceled) {
        setSelectedFile(null);
        return;
      }

      const asset = r.assets[0];
      const ext = asset.name.substring(asset.name.lastIndexOf('.')).toLowerCase();

      // Bloquear archivos PDF explícitamente
      if (ext === '.pdf') {
        Alert.alert(
          'Archivo no permitido',
          'No puedes seleccionar un archivo PDF porque ya se encuentra en formato PDF. Por favor, selecciona otro tipo de archivo.'
        );
        return;
      }

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
      
      // Obtener el nombre base del archivo seleccionado y asignarlo con la extensión .pdf
      const originalName = archivo.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      
      // Limpiar caracteres especiales de la URI pero conservar letras, números, espacios y guiones
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_\-]/g, '').trim();
      const pdfUri = `${FileSystem.documentDirectory}${cleanBaseName}.pdf`;
      
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
        {!loading && !resultado && (
          <>
            <MaterialCommunityIcons name="file-pdf-box" size={80} color="#ff4a36" />
            <Text style={comprimidorStyles.title}>Convertir a PDF</Text>
            <Text style={comprimidorStyles.subtitle}>
              Convierte documentos Word, Excel, PowerPoint, TXT, RTF, como imágenes JPG, PNG, BMP, GIF, TIFF, WebP y notebooks .ipynb a PDF de forma rápida y sencilla.
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

            {/* Se ha removido el desglose de archivo original y tamaño de PDF para mantener la interfaz simplificada */}

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

        {/* Formatos soportados removidos para simplificar la interfaz, ya que ahora se muestran en el mensaje de bienvenida superior */}
      </View>
    </ScrollView>
  );
}
