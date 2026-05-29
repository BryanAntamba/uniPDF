import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import NadvarIndex from '@/components/NavbarUsuario/NavbarUsuario';
import { comprimidorStyles } from '@/styles/pdfTools/ComprimirPDF';
import FirmaSimple from './ModalFirma/FirmaSimple';
import FirmaArrastrable from './FirmaArrastrable';

type Firma = {
  id: string;
  tipo: 'simple' | 'digital';
  texto: string;
  estilo: number;
  pagina: number;
  x: number;
  y: number;
  scale: number;
};

type Phase = 'idle' | 'editing' | 'done';

const formatMB = (bytes: number) => {
  if (!bytes || !Number.isFinite(bytes)) return '— MB';
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const getFileSize = async (uri: string): Promise<number> => {
  const info = await FileSystem.getInfoAsync(uri);
  return (info as { size?: number }).size ?? 0;
};

export default function FirmaPDF() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas] = useState(5); // Simulado, en producción se obtiene del PDF
  const [numeroPagina, setNumeroPagina] = useState('1');
  const [firmas, setFirmas] = useState<Firma[]>([]);
  const [firmaSeleccionada, setFirmaSeleccionada] = useState<string | null>(null);
  const [mostrarModalFirmaSimple, setMostrarModalFirmaSimple] = useState(false);
  const [firmaActual, setFirmaActual] = useState({
    texto: 'Firma de ejemplo',
    estilo: 0,
  });
  const [mostrarCampoFirma, setMostrarCampoFirma] = useState(false);

  const seleccionarPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setSelectedFile(null);
        return;
      }

      const asset = result.assets[0];
      const size = asset.size || (await getFileSize(asset.uri));
      setSelectedFile({ ...asset, size });
      setPhase('idle');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const iniciarFirma = () => {
    if (!selectedFile) return;
    setPhase('editing');
    setPaginaActual(1);
    setNumeroPagina('1');
    setFirmas([]);
    setFirmaSeleccionada(null);
  };

  const cambiarPagina = (direccion: 'arriba' | 'abajo') => {
    if (direccion === 'arriba' && paginaActual > 1) {
      const nueva = paginaActual - 1;
      setPaginaActual(nueva);
      setNumeroPagina(nueva.toString());
    } else if (direccion === 'abajo' && paginaActual < totalPaginas) {
      const nueva = paginaActual + 1;
      setPaginaActual(nueva);
      setNumeroPagina(nueva.toString());
    }
  };

  const irAPagina = () => {
    const num = parseInt(numeroPagina);
    if (num >= 1 && num <= totalPaginas) {
      setPaginaActual(num);
    } else {
      Alert.alert('Página inválida', `Ingresa un número entre 1 y ${totalPaginas}`);
      setNumeroPagina(paginaActual.toString());
    }
  };

  const agregarFirma = () => {
    if (!mostrarCampoFirma) {
      setMostrarCampoFirma(true);
      return;
    }

    const nuevaFirma: Firma = {
      id: `${Date.now()}-${Math.random()}`,
      tipo: 'simple',
      texto: firmaActual.texto,
      estilo: firmaActual.estilo,
      pagina: paginaActual,
      x: 50, // Posición inicial
      y: 50,
      scale: 1, // Escala inicial
    };

    setFirmas([...firmas, nuevaFirma]);
  };

  const actualizarFirma = (id: string, x: number, y: number, scale: number) => {
    setFirmas(firmas.map(f => f.id === id ? { ...f, x, y, scale } : f));
  };

  const eliminarFirma = (id: string) => {
    setFirmas(firmas.filter(f => f.id !== id));
    if (firmaSeleccionada === id) {
      setFirmaSeleccionada(null);
    }
  };

  const verFirma = (index: number) => {
    if (index >= 0 && index < firmas.length) {
      const firma = firmas[index];
      setPaginaActual(firma.pagina);
      setNumeroPagina(firma.pagina.toString());
      setFirmaSeleccionada(firma.id);
    }
  };

  const aplicarFirmaPersonalizada = (texto: string, estilo: number) => {
    setFirmaActual({ texto, estilo });
    setMostrarModalFirmaSimple(false);
  };

  const finalizarFirma = async () => {
    if (firmas.length === 0) {
      Alert.alert('Sin firmas', 'Agrega al menos una firma antes de finalizar');
      return;
    }

    // Aquí iría la lógica para aplicar las firmas al PDF
    Alert.alert(
      'Firmas aplicadas',
      `Se aplicaron ${firmas.length} firma(s) al documento`,
      [
        {
          text: 'OK',
          onPress: () => setPhase('done'),
        },
      ]
    );
  };

  const descargarPDF = async () => {
    if (!selectedFile) return;

    const nombreOriginal = selectedFile.name;
    const nombreSinExt = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
    
    // Simular descarga (en producción sería el PDF firmado)
    Alert.alert(
      'Descargar PDF',
      `Se descargará: ${nombreSinExt}_firmado.pdf`
    );
  };

  const reiniciar = () => {
    setSelectedFile(null);
    setPhase('idle');
    setFirmas([]);
    setFirmaSeleccionada(null);
    setMostrarCampoFirma(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={comprimidorStyles.container} contentContainerStyle={comprimidorStyles.scrollContainer}>
      <NadvarIndex />
      <View style={comprimidorStyles.content}>
        {/* Fase inicial */}
        {phase === 'idle' && !selectedFile && (
          <>
            <MaterialCommunityIcons name="draw" size={80} color="#ff4a36" />
            <Text style={comprimidorStyles.title}>Firmar PDF</Text>
            <Text style={comprimidorStyles.subtitle}>
              Agrega firmas digitales o manuscritas a tus documentos PDF de forma rápida y segura
            </Text>

            <TouchableOpacity style={comprimidorStyles.button} onPress={seleccionarPDF}>
              <Text style={comprimidorStyles.buttonText}>Seleccionar PDF</Text>
            </TouchableOpacity>
          </>
        )}

        {/* PDF seleccionado, listo para firmar */}
        {phase === 'idle' && selectedFile && (
          <>
            <MaterialCommunityIcons name="draw" size={80} color="#ff4a36" />
            <Text style={comprimidorStyles.title}>Firmar PDF</Text>
            <Text style={comprimidorStyles.subtitle}>
              Agrega firmas digitales o manuscritas a tus documentos PDF de forma rápida y segura
            </Text>

            <View style={[comprimidorStyles.fileContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={comprimidorStyles.fileText}>Archivo seleccionado:</Text>
                <Text style={comprimidorStyles.fileName} numberOfLines={1} ellipsizeMode="tail">
                  {selectedFile.name}
                </Text>
                <Text style={comprimidorStyles.fileSize}>Tamaño: {formatMB(selectedFile.size)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#ff4a36' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={comprimidorStyles.button} onPress={iniciarFirma}>
              <Text style={comprimidorStyles.buttonText}>Firmar PDF</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Editor de firmas */}
        {phase === 'editing' && (
          <View style={{ width: '100%' }}>
            {/* Controles de navegación */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              {/* Flechas de navegación */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => cambiarPagina('arriba')}
                  disabled={paginaActual === 1}
                  style={{
                    padding: 12,
                    backgroundColor: paginaActual === 1 ? '#e5e7eb' : '#ff4a36',
                    borderRadius: 8,
                  }}
                >
                  <MaterialIcons name="arrow-upward" size={24} color={paginaActual === 1 ? '#9ca3af' : '#ffffff'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => cambiarPagina('abajo')}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    padding: 12,
                    backgroundColor: paginaActual === totalPaginas ? '#e5e7eb' : '#ff4a36',
                    borderRadius: 8,
                  }}
                >
                  <MaterialIcons name="arrow-downward" size={24} color={paginaActual === totalPaginas ? '#9ca3af' : '#ffffff'} />
                </TouchableOpacity>
              </View>

              {/* Selector de página */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, color: '#666' }}>Página:</Text>
                <TextInput
                  value={numeroPagina}
                  onChangeText={setNumeroPagina}
                  onSubmitEditing={irAPagina}
                  keyboardType="number-pad"
                  style={{
                    width: 50,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    textAlign: 'center',
                    fontSize: 14,
                  }}
                />
                <Text style={{ fontSize: 14, color: '#666' }}>de {totalPaginas}</Text>
              </View>
            </View>

            {/* Vista previa del PDF */}
            <View
              style={{
                width: '100%',
                height: 400,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#e5e7eb',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                position: 'relative',
              }}
            >
              <MaterialIcons name="picture-as-pdf" size={100} color="#ff4a36" />
              <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>
                Página {paginaActual} de {totalPaginas}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {selectedFile?.name}
              </Text>

              {/* Firmas en esta página */}
              {firmas
                .filter(f => f.pagina === paginaActual)
                .map(firma => (
                  <FirmaArrastrable
                    key={firma.id}
                    firma={firma}
                    isSelected={firmaSeleccionada === firma.id}
                    onSelect={() => setFirmaSeleccionada(firma.id === firmaSeleccionada ? null : firma.id)}
                    onDelete={() => eliminarFirma(firma.id)}
                    onUpdate={(x, y, scale) => actualizarFirma(firma.id, x, y, scale)}
                  />
                ))}
            </View>

            {/* Botón Firma Simple */}
            <TouchableOpacity
              onPress={() => setMostrarCampoFirma(!mostrarCampoFirma)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#ff4a36',
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>
                Firma Simple
              </Text>
            </TouchableOpacity>

            {/* Campo de firma */}
            {mostrarCampoFirma && (
              <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {/* Campo de firma */}
                  <TouchableOpacity
                    onPress={agregarFirma}
                    style={{
                      flex: 1,
                      padding: 16,
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                    }}
                  >
                    <Text style={{ fontSize: 16, color: '#ff4a36', fontStyle: 'italic' }}>
                      {firmaActual.texto}
                    </Text>
                  </TouchableOpacity>

                  {/* Icono de editar */}
                  <TouchableOpacity
                    onPress={() => setMostrarModalFirmaSimple(true)}
                    style={{
                      padding: 12,
                      backgroundColor: '#ff4a36',
                      borderRadius: 8,
                    }}
                  >
                    <MaterialIcons name="edit" size={24} color="#ffffff" />
                  </TouchableOpacity>

                  {/* Contador de firmas */}
                  <TouchableOpacity
                    onPress={() => {
                      if (firmas.length > 0) {
                        const currentIndex = firmas.findIndex(f => f.id === firmaSeleccionada);
                        const nextIndex = (currentIndex + 1) % firmas.length;
                        verFirma(nextIndex);
                      }
                    }}
                    style={{
                      padding: 12,
                      backgroundColor: '#ff4a36',
                      borderRadius: 8,
                      minWidth: 48,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                      {firmas.length}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                  Toca el campo para agregar la firma en la página actual
                </Text>
              </View>
            )}

            {/* Botón finalizar */}
            <TouchableOpacity
              onPress={finalizarFirma}
              style={[comprimidorStyles.button, { marginTop: 8 }]}
            >
              <Text style={comprimidorStyles.buttonText}>
                Finalizar y Guardar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resultado */}
        {phase === 'done' && (
          <View style={{ width: '100%', alignItems: 'center' }}>
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
              ¡PDF firmado exitosamente!
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              Se aplicaron {firmas.length} firma(s) al documento
            </Text>

            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDF}>
              <Text style={comprimidorStyles.buttonText}>Descargar PDF Firmado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[comprimidorStyles.button, { backgroundColor: '#f3f4f6', marginTop: 12 }]}
              onPress={reiniciar}
            >
              <Text style={[comprimidorStyles.buttonText, { color: '#111' }]}>
                Firmar otro PDF
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de Firma Simple */}
      <Modal
        visible={mostrarModalFirmaSimple}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMostrarModalFirmaSimple(false)}
      >
        <FirmaSimple
          onClose={() => setMostrarModalFirmaSimple(false)}
          onAplicar={aplicarFirmaPersonalizada}
          firmaInicial={firmaActual.texto}
          estiloInicial={firmaActual.estilo}
        />
      </Modal>
    </ScrollView>
    </GestureHandlerRootView>
  );
}

