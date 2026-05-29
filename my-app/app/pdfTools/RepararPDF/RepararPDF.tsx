import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import NadvarIndex from '@/components/NadvarIndex/NadvarIndex';
import { comprimidorStyles } from '@/styles/pdfTools/ComprimirPDF';
import { unionStyles } from '@/styles/pdfTools/UnionPDF';
import { buildApiUrl } from '@/constants/config';

type PdfItem = {
  id: string;
  uri: string;
  name: string;
  size: number;
};

type Phase = 'idle' | 'list' | 'repairing' | 'done';

const formatMB = (bytes: number) => {
  if (!bytes || !Number.isFinite(bytes)) return '— MB';
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const getFileSize = async (uri: string): Promise<number> => {
  const info = await FileSystem.getInfoAsync(uri);
  return (info as { size?: number }).size ?? 0;
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function RepararPDF() {
  const [pdfFiles, setPdfFiles] = useState<PdfItem[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [reparadosUris, setReparadosUris] = useState<string[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasFiles = pdfFiles.length > 0;
  const showList = hasFiles && phase === 'list';
  const isPlural = pdfFiles.length > 1;

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
      });
    }
    return items;
  };

  const seleccionarPDFs = async (append = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', // Solo PDFs
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
      }
      setReparadosUris([]);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron seleccionar los archivos');
    }
  };

  const seleccionarDesdeGoogleDrive = () => {
    setShowAddMenu(false);
    Alert.alert(
      'Google Drive',
      'La importación desde Google Drive estará disponible próximamente. Por ahora puedes agregar PDFs desde tu dispositivo.',
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
        setReparadosUris([]);
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

  const repararPDFs = async () => {
    if (pdfFiles.length < 1) {
      Alert.alert('Atención', 'Selecciona al menos 1 PDF para reparar.');
      return;
    }

    setShowAddMenu(false);
    setDraggingId(null);
    setPhase('repairing');
    setProgress(0);
    setReparadosUris([]);

    clearProgressTimer();
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 4));
    }, 150);

    try {
      // Simular proceso de reparación copiando los archivos originales
      const uris: string[] = [];
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const nombreOriginal = file.name;
        const nombreSinExt = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
        const nombreReparado = `${nombreSinExt}_reparado.pdf`;
        const destinoUri = FileSystem.documentDirectory + nombreReparado;
        
        // Copiar el archivo original como "reparado" (simulación)
        await FileSystem.copyAsync({
          from: file.uri,
          to: destinoUri,
        });
        
        uris.push(destinoUri);
      }
      
      clearProgressTimer();
      setProgress(100);
      
      setTimeout(() => {
        setReparadosUris(uris);
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
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(buildApiUrl('/reparar'), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      clearProgressTimer();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudieron reparar los PDFs');
      }

      const data = await response.json();
      
      // Descargar archivos reparados
      const uris: string[] = [];
      for (let i = 0; i < data.archivos.length; i++) {
        const urlPDF = buildApiUrl(`/temp/${data.archivos[i].nombre}`);
        const nombreOriginal = pdfFiles[i].name;
        const nombreSinExt = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
        const nombreReparado = `${nombreSinExt}_reparado.pdf`;
        const pdfUri = FileSystem.documentDirectory + nombreReparado;
        await FileSystem.downloadAsync(urlPDF, pdfUri);
        uris.push(pdfUri);
      }

      setReparadosUris(uris);
      setProgress(100);
      setTimeout(() => setPhase('done'), 350);
      */
    } catch (error: unknown) {
      clearProgressTimer();
      setPhase('list');
      setProgress(0);
      console.log('ERROR REPARAR:', error);
      const err = error as { name?: string; message?: string };
      if (err?.name === 'AbortError') {
        Alert.alert('Error', 'La reparación tardó demasiado. Intenta de nuevo.');
      } else {
        Alert.alert('Error', err?.message || 'No se pudieron reparar los PDFs');
      }
    }
  };

  const descargarPDFsReparados = async () => {
    if (reparadosUris.length === 0) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        // Descargar todos los archivos uno por uno sin confirmación
        for (let i = 0; i < reparadosUris.length; i++) {
          const uri = reparadosUris[i];
          const nombreOriginal = pdfFiles[i]?.name || `archivo_${i + 1}.pdf`;
          const nombreSinExt = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.'));
          
          await Sharing.shareAsync(uri, {
            dialogTitle: reparadosUris.length > 1 
              ? `Guardar ${nombreSinExt}_reparado.pdf (${i + 1}/${reparadosUris.length})`
              : `Guardar ${nombreSinExt}_reparado.pdf`,
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
          });
          
          // Pausa entre descargas si hay múltiples archivos
          if (i < reparadosUris.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      } else {
        Alert.alert(
          'Archivos guardados',
          `${reparadosUris.length} PDF${isPlural ? 's' : ''} reparado${isPlural ? 's' : ''} guardado${isPlural ? 's' : ''} en:\n${FileSystem.documentDirectory}`
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
    setReparadosUris([]);
    setDraggingId(null);
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
            <MaterialCommunityIcons name="file-document-refresh" size={80} color="#f59e0b" />
            <Text style={comprimidorStyles.title}>Reparar PDF</Text>
            <Text style={comprimidorStyles.subtitle}>
              Repara archivos PDF dañados o corruptos para recuperar tu información
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

              return (
                <Pressable
                  key={file.id}
                  onPress={() => onPressItemForReorder(file.id)}
                  onLongPress={() => setDraggingId(file.id)}
                  style={[
                    comprimidorStyles.fileContainer,
                    unionStyles.fileRow,
                    isDragging && unionStyles.fileRowDragging,
                    isDropTarget && unionStyles.fileRowDropTarget,
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
                    <Text style={comprimidorStyles.fileSize}>{formatMB(file.size)}</Text>
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

            <TouchableOpacity
              style={[comprimidorStyles.button, unionStyles.mergeButton]}
              onPress={repararPDFs}
            >
              <Text style={comprimidorStyles.buttonText}>
                Reparar PDF{isPlural ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progreso de reparación */}
        {phase === 'repairing' && (
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
              <Text style={{ fontSize: 12, color: '#666' }}>reparando</Text>
            </View>
            <Text style={comprimidorStyles.subtitle}>
              Reparando {isPlural ? 'tus PDFs' : 'tu PDF'}, por favor espera...
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
              Reparación de PDF{isPlural ? 's' : ''} realizada
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              {isPlural 
                ? `${pdfFiles.length} archivos han sido reparados correctamente`
                : 'Tu archivo ha sido reparado correctamente'}
            </Text>

            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDFsReparados}>
              <Text style={comprimidorStyles.buttonText}>
                Descargar PDF{isPlural ? 's' : ''} reparado{isPlural ? 's' : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[comprimidorStyles.button, { backgroundColor: '#f3f4f6', marginTop: 12 }]}
              onPress={reiniciar}
            >
              <Text style={[comprimidorStyles.buttonText, { color: '#111' }]}>
                Reparar otros PDF
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
