import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import NadvarIndex from '@/components/NavbarUsuario/NavbarUsuario';
import { comprimidorStyles } from '@/styles/pdfTools/ComprimirPDF';
import { unionStyles } from '@/styles/pdfTools/UnionPDF';
import { buildApiUrl } from '@/constants/config';

type PdfItem = {
  id: string;
  uri: string;
  name: string;
  size: number;
  rotacion: number; // 0, 90, 180, 270
};

type Phase = 'idle' | 'list' | 'rotating' | 'done';

const formatMB = (bytes: number) => {
  if (!bytes || !Number.isFinite(bytes)) return '— MB';
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const getFileSize = async (uri: string): Promise<number> => {
  const info = await FileSystem.getInfoAsync(uri);
  return (info as { size?: number }).size ?? 0;
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function RotarPDF() {
  const [pdfFiles, setPdfFiles] = useState<PdfItem[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [rotadosUris, setRotadosUris] = useState<string[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasFiles = pdfFiles.length > 0;
  const showList = hasFiles && phase === 'list';
  const isPlural = pdfFiles.length > 1;
  const selectedFile = pdfFiles.find(f => f.id === selectedId);

  const clearProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const assetsToPdfItems = async (
    assets: DocumentPicker.DocumentPickerAsset[]
  ): Promise<PdfItem[]> => {
    const items: PdfItem[] = [];
    for (const asset of assets) {
      const size = asset.size ?? (await getFileSize(asset.uri));
      items.push({
        id: makeId(),
        uri: asset.uri,
        name: asset.name,
        size,
        rotacion: 0, // Sin rotación inicial
      });
    }
    return items;
  };

  const seleccionarPDFs = async (append = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const nuevos = await assetsToPdfItems(result.assets);

      if (append) {
        setPdfFiles((prev) => {
          const uris = new Set(prev.map((f) => f.uri));
          return [...prev, ...nuevos.filter((f) => !uris.has(f.uri))];
        });
        setPhase('list');
      } else {
        setPdfFiles(nuevos);
        setPhase('list');
        // Seleccionar el primer archivo automáticamente
        if (nuevos.length > 0) {
          setSelectedId(nuevos[0].id);
        }
      }
      setRotadosUris([]);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron seleccionar los archivos');
    }
  };

  const seleccionarDesdeGoogleDrive = () => {
    setShowAddMenu(false);
    Alert.alert(
      'Google Drive',
      'La importación desde Google Drive estará disponible próximamente.',
      [{ text: 'Entendido' }]
    );
  };

  const toggleOrden = () => {
    setSortAsc((prev) => {
      setPdfFiles((files) => {
        const sorted = [...files].sort((a, b) =>
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        );
        return prev ? sorted.reverse() : sorted;
      });
      return !prev;
    });
  };

  const eliminarPDF = (id: string) => {
    setPdfFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        setPhase('idle');
        setRotadosUris([]);
        setSelectedId(null);
      } else if (selectedId === id) {
        // Si eliminamos el seleccionado, seleccionar el primero
        setSelectedId(next[0].id);
      }
      return next;
    });
  };

  const moverPDF = (id: string, direction: 'up' | 'down') => {
    setPdfFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const moverAPosicion = (id: string, toIndex: number) => {
    setPdfFiles((prev) => {
      const fromIndex = prev.findIndex((f) => f.id === id);
      if (fromIndex === -1 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
    setDraggingId(null);
  };

  const onPressItemForReorder = (id: string) => {
    if (!draggingId) {
      setDraggingId(id);
      return;
    }
    if (draggingId === id) {
      setDraggingId(null);
      return;
    }
    const toIndex = pdfFiles.findIndex((f) => f.id === id);
    moverAPosicion(draggingId, toIndex);
  };

  const rotarIzquierda = () => {
    if (!selectedId) return;
    setPdfFiles((prev) =>
      prev.map((f) =>
        f.id === selectedId
          ? { ...f, rotacion: (f.rotacion - 90 + 360) % 360 }
          : f
      )
    );
  };

  const rotarDerecha = () => {
    if (!selectedId) return;
    setPdfFiles((prev) =>
      prev.map((f) =>
        f.id === selectedId
          ? { ...f, rotacion: (f.rotacion + 90) % 360 }
          : f
      )
    );
  };

  const rotarPDFs = async () => {
    if (pdfFiles.length < 1) {
      Alert.alert('Atención', 'Selecciona al menos 1 PDF para rotar.');
      return;
    }

    setShowAddMenu(false);
    setDraggingId(null);
    setPhase('rotating');
    setProgress(0);
    setRotadosUris([]);

    clearProgressTimer();
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 4));
    }, 150);

    try {
      // Simular proceso de rotación copiando los archivos
      const uris: string[] = [];
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const nombreOriginal = file.name;
        const nombreSinExt = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
        const nombreRotado = `${nombreSinExt}_rotado.pdf`;
        const destinoUri = FileSystem.documentDirectory + nombreRotado;
        
        // Copiar el archivo (en producción aquí se rotaría realmente)
        await FileSystem.copyAsync({
          from: file.uri,
          to: destinoUri,
        });
        
        uris.push(destinoUri);
      }
      
      clearProgressTimer();
      setProgress(100);
      
      setTimeout(() => {
        setRotadosUris(uris);
        setPhase('done');
      }, 500);

      /* Código para cuando esté el endpoint:
      const formData = new FormData();
      pdfFiles.forEach((file) => {
        formData.append('archivos', {
          uri: file.uri,
          name: file.name,
          type: 'application/pdf',
        } as unknown as Blob);
        formData.append('rotaciones', file.rotacion.toString());
      });

      const response = await fetch(buildApiUrl('/rotar'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      const uris: string[] = [];
      for (let i = 0; i < data.archivos.length; i++) {
        const urlPDF = buildApiUrl(`/temp/${data.archivos[i].nombre}`);
        const nombreOriginal = pdfFiles[i].name;
        const nombreSinExt = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
        const nombreRotado = `${nombreSinExt}_rotado.pdf`;
        const pdfUri = FileSystem.documentDirectory + nombreRotado;
        await FileSystem.downloadAsync(urlPDF, pdfUri);
        uris.push(pdfUri);
      }

      setRotadosUris(uris);
      setProgress(100);
      setTimeout(() => setPhase('done'), 350);
      */
    } catch (error: unknown) {
      clearProgressTimer();
      setPhase('list');
      setProgress(0);
      console.log('ERROR ROTAR:', error);
      Alert.alert('Error', 'No se pudieron rotar los PDFs');
    }
  };

  const descargarPDFsRotados = async () => {
    if (rotadosUris.length === 0) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        for (let i = 0; i < rotadosUris.length; i++) {
          const uri = rotadosUris[i];
          const nombreOriginal = pdfFiles[i]?.name || `archivo_${i + 1}.pdf`;
          const nombreSinExt = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
          
          await Sharing.shareAsync(uri, {
            dialogTitle: rotadosUris.length > 1 
              ? `Guardar ${nombreSinExt}_rotado.pdf (${i + 1}/${rotadosUris.length})`
              : `Guardar ${nombreSinExt}_rotado.pdf`,
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
          });
          
          if (i < rotadosUris.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      } else {
        Alert.alert(
          'Archivos guardados',
          `${rotadosUris.length} PDF${isPlural ? 's' : ''} rotado${isPlural ? 's' : ''} guardado${isPlural ? 's' : ''}`
        );
      }
    } catch (error) {
      console.log('ERROR DESCARGAR:', error);
      Alert.alert('Error', 'No se pudieron descargar los archivos');
    }
  };

  const reiniciar = () => {
    setPdfFiles([]);
    setPhase('idle');
    setProgress(0);
    setRotadosUris([]);
    setDraggingId(null);
    setSelectedId(null);
    clearProgressTimer();
  };

  return (
    <ScrollView
      style={comprimidorStyles.container}
      contentContainerStyle={comprimidorStyles.scrollContainer}
    >
      <NadvarIndex />

      <View style={comprimidorStyles.content}>
        {/* Fase inicial */}
        {phase === 'idle' && !hasFiles && (
          <>
            <MaterialCommunityIcons name="rotate-right" size={80} color="#ff4a36" />
            <Text style={comprimidorStyles.title}>Rotar PDF</Text>
            <Text style={comprimidorStyles.subtitle}>
              Rota las páginas de tus archivos PDF en el ángulo que necesites de forma rápida y sencilla
            </Text>

            <TouchableOpacity style={comprimidorStyles.button} onPress={() => seleccionarPDFs(false)}>
              <Text style={comprimidorStyles.buttonText}>Seleccionar PDFs</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Lista de archivos */}
        {showList && (
          <View style={unionStyles.listSection}>
            <View style={unionStyles.toolbar}>
              <Text style={unionStyles.fileCount}>
                {pdfFiles.length} {pdfFiles.length === 1 ? 'archivo' : 'archivos'}
              </Text>
              <View style={unionStyles.toolbarActions}>
                <TouchableOpacity style={unionStyles.sortButton} onPress={toggleOrden}>
                  <Text style={unionStyles.sortButtonText}>{sortAsc ? 'A → Z' : 'Z → A'}</Text>
                </TouchableOpacity>
                <View style={unionStyles.addMenuWrapper}>
                  <TouchableOpacity
                    style={unionStyles.addButton}
                    onPress={() => setShowAddMenu((v) => !v)}
                  >
                    <Text style={unionStyles.addButtonText}>+</Text>
                  </TouchableOpacity>
                  {showAddMenu && (
                    <View style={unionStyles.dropdownMenu}>
                      <Pressable
                        style={unionStyles.menuItem}
                        onPress={() => {
                          setShowAddMenu(false);
                          seleccionarPDFs(true);
                        }}
                      >
                        <MaterialIcons name="picture-as-pdf" size={20} color="#ff4a36" />
                        <Text style={unionStyles.menuItemText}>Agregar PDF</Text>
                      </Pressable>
                      <View style={unionStyles.menuDivider} />
                      <Pressable style={unionStyles.menuItem} onPress={seleccionarDesdeGoogleDrive}>
                        <FontAwesome name="google" size={18} color="#4285F4" />
                        <Text style={unionStyles.menuItemText}>Seleccionar PDF desde Google Drive</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {draggingId && (
              <Text style={unionStyles.reorderHint}>
                Toca otro PDF para colocarlo en esa posición, o el mismo para cancelar.
              </Text>
            )}

            {pdfFiles.map((file, index) => {
              const isDragging = draggingId === file.id;
              const isDropTarget = draggingId && draggingId !== file.id;
              const isSelected = selectedId === file.id;

              return (
                <Pressable
                  key={file.id}
                  onPress={() => {
                    if (draggingId) {
                      onPressItemForReorder(file.id);
                    } else {
                      setSelectedId(file.id);
                    }
                  }}
                  onLongPress={() => setDraggingId(file.id)}
                  style={[
                    comprimidorStyles.fileContainer,
                    unionStyles.fileRow,
                    isDragging && unionStyles.fileRowDragging,
                    isDropTarget && unionStyles.fileRowDropTarget,
                    isSelected && { borderColor: '#ff4a36', borderWidth: 2 },
                  ]}
                >
                  <View style={unionStyles.orderBadge}>
                    <Text style={unionStyles.orderBadgeText}>{index + 1}</Text>
                  </View>

                  <TouchableOpacity
                    style={unionStyles.gripButton}
                    onLongPress={() => setDraggingId(file.id)}
                    onPress={() => onPressItemForReorder(file.id)}
                  >
                    <Text style={unionStyles.gripIcon}>☰</Text>
                  </TouchableOpacity>

                  <View style={unionStyles.fileInfo}>
                    <Text style={comprimidorStyles.fileName} numberOfLines={2} ellipsizeMode="tail">
                      {file.name}
                    </Text>
                    <Text style={comprimidorStyles.fileSize}>
                      {formatMB(file.size)} • Rotación: {file.rotacion}°
                    </Text>
                  </View>

                  <View style={unionStyles.rowActions}>
                    <TouchableOpacity
                      onPress={() => moverPDF(file.id, 'up')}
                      disabled={index === 0}
                      style={[unionStyles.moveButton, index === 0 && unionStyles.moveButtonDisabled]}
                    >
                      <Text style={unionStyles.moveButtonText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moverPDF(file.id, 'down')}
                      disabled={index === pdfFiles.length - 1}
                      style={[
                        unionStyles.moveButton,
                        index === pdfFiles.length - 1 && unionStyles.moveButtonDisabled,
                      ]}
                    >
                      <Text style={unionStyles.moveButtonText}>↓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => eliminarPDF(file.id)} style={unionStyles.deleteButton}>
                      <Text style={unionStyles.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              );
            })}

            {/* Vista previa y controles de rotación */}
            {selectedFile && (
              <View style={{ width: '100%', marginTop: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12, textAlign: 'center' }}>
                  Vista previa: {selectedFile.name}
                </Text>
                
                {/* Simulación de vista previa */}
                <View
                  style={{
                    width: '100%',
                    height: 200,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    transform: [{ rotate: `${selectedFile.rotacion}deg` }],
                  }}
                >
                  <MaterialIcons name="picture-as-pdf" size={80} color="#ff4a36" />
                  <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                    Rotación: {selectedFile.rotacion}°
                  </Text>
                </View>

                {/* Botones de rotación */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={rotarIzquierda}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 12,
                      backgroundColor: '#ff4a36',
                      borderRadius: 12,
                      gap: 8,
                    }}
                  >
                    <MaterialCommunityIcons name="rotate-left" size={24} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                      Izquierda
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={rotarDerecha}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 12,
                      backgroundColor: '#ff4a36',
                      borderRadius: 12,
                      gap: 8,
                    }}
                  >
                    <MaterialCommunityIcons name="rotate-right" size={24} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                      Derecha
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[comprimidorStyles.button, unionStyles.mergeButton]}
              onPress={rotarPDFs}
            >
              <Text style={comprimidorStyles.buttonText}>
                Rotar PDF{isPlural ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progreso de rotación */}
        {phase === 'rotating' && (
          <View style={unionStyles.progressSection}>
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
              <Text style={{ fontSize: 12, color: '#666' }}>rotando</Text>
            </View>
            <Text style={comprimidorStyles.subtitle}>
              Rotando {isPlural ? 'tus PDFs' : 'tu PDF'}, por favor espera...
            </Text>
          </View>
        )}

        {/* Resultado exitoso */}
        {phase === 'done' && (
          <View style={unionStyles.resultSection}>
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

            <Text style={unionStyles.resultTitle}>
              {isPlural ? 'Los PDFs rotaron correctamente' : 'El PDF rotó correctamente'}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              {isPlural 
                ? `${pdfFiles.length} archivos han sido rotados correctamente`
                : 'Tu archivo ha sido rotado correctamente'}
            </Text>

            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDFsRotados}>
              <Text style={comprimidorStyles.buttonText}>
                Descargar PDF{isPlural ? 's' : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[comprimidorStyles.button, { backgroundColor: '#f3f4f6', marginTop: 12 }]}
              onPress={reiniciar}
            >
              <Text style={[comprimidorStyles.buttonText, { color: '#111' }]}>
                Rotar otros PDFs
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

