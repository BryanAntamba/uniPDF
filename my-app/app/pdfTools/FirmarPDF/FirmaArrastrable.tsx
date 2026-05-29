import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

type FirmaArrastrableProps = {
  firma: {
    id: string;
    texto: string;
    x: number;
    y: number;
    scale: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (x: number, y: number, scale: number) => void;
};

export default function FirmaArrastrable({
  firma,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
}: FirmaArrastrableProps) {
  const translateX = useSharedValue(firma.x);
  const translateY = useSharedValue(firma.y);
  const scale = useSharedValue(firma.scale);
  const savedScale = useSharedValue(firma.scale);

  // Gesto de arrastre (pan)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX + firma.x;
      translateY.value = event.translationY + firma.y;
    })
    .onEnd(() => {
      try {
        const validScale = Math.max(0.5, Math.min(scale.value, 3)); // Escala entre 0.5 y 3
        onUpdate(translateX.value, translateY.value, validScale);
      } catch (error) {
        console.warn('Error al actualizar firma:', error);
      }
    });

  // Gesto de pellizco (pinch) para escalar
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      // Limitar escala entre 0.5 y 3
      scale.value = Math.max(0.5, Math.min(newScale, 3));
    })
    .onEnd(() => {
      try {
        const validScale = Math.max(0.5, Math.min(scale.value, 3));
        savedScale.value = validScale;
        onUpdate(translateX.value, translateY.value, validScale);
      } catch (error) {
        console.warn('Error al finalizar gesto de escala:', error);
      }
    });

  // Combinar gestos
  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(translateX.value) },
      { translateY: withSpring(translateY.value) },
      { scale: withSpring(scale.value) },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.firmaContainer,
          animatedStyle,
          isSelected && styles.firmaSelected,
        ]}
      >
        <TouchableOpacity onPress={onSelect} style={styles.firmaContent}>
          <Text style={styles.firmaText}>{firma.texto}</Text>
        </TouchableOpacity>

        {isSelected && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <MaterialIcons name="close" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  firmaContainer: {
    position: 'absolute',
    padding: 8,
    backgroundColor: '#ff4a3615',
    borderRadius: 8,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  firmaSelected: {
    borderWidth: 2,
    borderColor: '#ff4a36',
  },
  firmaContent: {
    padding: 4,
  },
  firmaText: {
    fontSize: 14,
    color: '#ff4a36',
    fontStyle: 'italic',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4a36',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
