import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import NadvarIndex from '@/components/NadvarIndex/NadvarIndex';
import { indexStyles } from '@/styles/Index';

type AppRoute = '/' | '/ConvertidorPDF/ConvertidorPDF' | '/UnionPDF/UnionPDF' | '/FirmarPDF/FirmaPDF' | '/ComprimidorPDF/ComprimidorPDF';

const cards: Array<{ title: string; description: string; route: AppRoute; image: any }> = [
  {
    title: 'Convertir PDF',
    description: 'Convierte documentos Office y otros formatos a PDF en segundos.',
    route: '/ConvertidorPDF/ConvertidorPDF',
    image: require('@/assets/images/ConvertirPDF.png'),
  },
  {
    title: 'Unir PDF',
    description: 'Combina varios archivos en un solo PDF de forma rápida y sencilla.',
    route: '/UnionPDF/UnionPDF',
    image: require('@/assets/images/UnirPDF.png'),
  },
  {
    title: 'Firmar PDF',
    description: 'Agrega firmas digitales o manuscritas a tus documentos PDF.',
    route: '/FirmarPDF/FirmaPDF',
    image: require('@/assets/images/FirmarPDF.png'),
  },
  {
    title: 'Comprimir PDF',
    description: 'Reduce el tamaño de tus archivos PDF sin perder calidad.',
    route: '/ComprimidorPDF/ComprimidorPDF',
    image: require('@/assets/images/ComprimirPDF.png'),
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <ScrollView style={indexStyles.container} contentContainerStyle={indexStyles.scrollContainer}>
      <NadvarIndex />
      <View style={indexStyles.heroContainer}>
        <Text style={indexStyles.heroTitle}>Herramientas online para amantes de los PDF</Text>
        <Text style={indexStyles.heroDescription}>
          Herramientas online y completamente gratuitas para unir PDF, comprimir PDF, convertir documentos Office y otros tipos de documentos o archicos a PDF, Implementacion de agente inteligente para correccion de PDF. No se necesita instalación.
        </Text>
      </View>
      <View style={indexStyles.cardsContainer}>
        {cards.map((card) => (
          <TouchableOpacity key={card.title} style={indexStyles.card} onPress={() => router.push(card.route as any)}>
            <View style={indexStyles.cardText}>
              <Text style={indexStyles.cardTitle}>{card.title}</Text>
              <Text style={indexStyles.cardDescription}>{card.description}</Text>
            </View>
            <Image source={card.image} style={indexStyles.cardImage} resizeMode="contain" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
