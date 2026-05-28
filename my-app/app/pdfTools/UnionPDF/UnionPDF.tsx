import React, { useState, useRef } from 'react';

import {

  ScrollView,

  View,

  Text,

  TouchableOpacity,

  Image,

  Alert,

  Pressable,

} from 'react-native';

import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

import * as DocumentPicker from 'expo-document-picker';

import * as FileSystem from 'expo-file-system/legacy';

import * as Sharing from 'expo-sharing';

import NadvarIndex from '@/components/NadvarIndex/NadvarIndex';

import { comprimidorStyles } from '@/styles/pdfTools/ComprimirPDF';

import { unionStyles } from '@/styles/pdfTools/UnionPDF';



type PdfItem = {

  id: string;

  uri: string;

  name: string;

  size: number;

};



type Phase = 'idle' | 'list' | 'merging' | 'done';



const getBackendHost = () => '192.168.70.122';



const formatMB = (bytes: number) => {

  if (!bytes || !Number.isFinite(bytes)) return '— MB';

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;

};



const getFileSize = async (uri: string): Promise<number> => {

  const info = await FileSystem.getInfoAsync(uri);

  return (info as { size?: number }).size ?? 0;

};



const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;



export default function UnionPDF() {

  const [pdfFiles, setPdfFiles] = useState<PdfItem[]>([]);

  const [phase, setPhase] = useState<Phase>('idle');

  const [progress, setProgress] = useState(0);

  const [mergedPdfUri, setMergedPdfUri] = useState<string | null>(null);

  const [showAddMenu, setShowAddMenu] = useState(false);

  const [sortAsc, setSortAsc] = useState(true);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);



  const hasFiles = pdfFiles.length > 0;

  const showList = hasFiles && phase === 'list';



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

      }

      setMergedPdfUri(null);

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

        setMergedPdfUri(null);

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



  const unirPDFs = async () => {

    if (pdfFiles.length < 2) {

      Alert.alert('Atención', 'Selecciona al menos 2 PDFs para unir.');

      return;

    }



    setShowAddMenu(false);

    setDraggingId(null);

    setPhase('merging');

    setProgress(0);

    setMergedPdfUri(null);



    clearProgressTimer();

    progressTimer.current = setInterval(() => {

      setProgress((p) => (p >= 90 ? 90 : p + 4));

    }, 150);



    try {

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



      const response = await fetch(`http://${getBackendHost()}:3000/unir`, {

        method: 'POST',

        body: formData,

        signal: controller.signal,

      });



      clearTimeout(timeout);

      clearProgressTimer();



      if (!response.ok) {

        const error = await response.json();

        throw new Error(error.error || 'No se pudieron unir los PDFs');

      }



      const data = await response.json();

      const urlPDF = `http://${getBackendHost()}:3000/temp/${data.nombre}`;

      const pdfUri = FileSystem.documentDirectory + 'pdf_unido.pdf';

      await FileSystem.downloadAsync(urlPDF, pdfUri);



      setMergedPdfUri(pdfUri);

      setProgress(100);

      setTimeout(() => setPhase('done'), 350);

    } catch (error: unknown) {

      clearProgressTimer();

      setPhase('list');

      setProgress(0);

      console.log('ERROR UNIR:', error);

      const err = error as { name?: string; message?: string };

      if (err?.name === 'AbortError') {

        Alert.alert('Error', 'La unión tardó demasiado. Intenta de nuevo.');

      } else {

        Alert.alert('Error', err?.message || 'No se pudieron unir los PDFs');

      }

    }

  };



  const descargarPDFUnido = async () => {

    if (!mergedPdfUri) return;

    if (await Sharing.isAvailableAsync()) {

      await Sharing.shareAsync(mergedPdfUri, {

        dialogTitle: 'Descargar PDF unido',

        mimeType: 'application/pdf',

        UTI: 'com.adobe.pdf',

      });

    } else {

      Alert.alert('Guardar PDF', `El archivo se guardó en: ${mergedPdfUri}`);

    }

  };



  return (

    <ScrollView

      style={comprimidorStyles.container}

      contentContainerStyle={comprimidorStyles.scrollContainer}

    >

      <NadvarIndex />



      <View style={comprimidorStyles.content}>

        {phase === 'idle' && !hasFiles && (

          <>

            <Image

              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/337/337954.png' }}

              style={comprimidorStyles.logo}

            />

            <Text style={comprimidorStyles.title}>Unir PDF</Text>

            <Text style={comprimidorStyles.subtitle}>

              Junta varios documentos en un único PDF listo para descargar o compartir.

            </Text>



            <TouchableOpacity style={comprimidorStyles.button} onPress={() => seleccionarPDFs(false)}>

              <Text style={comprimidorStyles.buttonText}>Seleccionar PDFs</Text>

            </TouchableOpacity>

          </>

        )}



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

              onPress={unirPDFs}

            >

              <Text style={comprimidorStyles.buttonText}>Unir PDFs</Text>

            </TouchableOpacity>

          </View>

        )}



        {phase === 'merging' && (

          <View style={unionStyles.progressSection}>

            <View style={unionStyles.progressCircle}>

              <Text style={unionStyles.progressPercent}>{progress}%</Text>

              <Text style={unionStyles.progressLabel}>uniendo</Text>

            </View>

            <Text style={comprimidorStyles.subtitle}>Uniendo tus PDFs, por favor espera...</Text>

          </View>

        )}



        {phase === 'done' && (

          <View style={unionStyles.resultSection}>

            <Text style={unionStyles.resultTitle}>Los PDFs están unidos</Text>

            <TouchableOpacity style={comprimidorStyles.button} onPress={descargarPDFUnido}>

              <Text style={comprimidorStyles.buttonText}>Descargar el PDF unido</Text>

            </TouchableOpacity>

          </View>

        )}

      </View>

    </ScrollView>

  );

}


