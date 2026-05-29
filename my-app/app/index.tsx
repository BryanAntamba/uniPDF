import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import NadvarIndex from '@/components/NavbarUsuario/NavbarUsuario';
import { indexStyles } from '@/styles/Index';

type AppRoute = 
  | '/' 
  | '/pdfTools/ConvertidorPDF/ConvertidorPDF' 
  | '/pdfTools/UnionPDF/UnionPDF' 
  | '/pdfTools/FirmarPDF/FirmaPDF' 
  | '/pdfTools/ComprimidorPDF/ComprimidorPDF'
  | '/pdfTools/RepararPDF/RepararPDF'
  | '/pdfTools/RotarPDF/RotarPDF';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap | keyof typeof MaterialIcons.glyphMap;

const cards: Array<{ 
  title: string; 
  description: string; 
  route: AppRoute; 
  icon: IconName;
  iconLibrary: 'MaterialCommunityIcons' | 'MaterialIcons';
  color: string;
}> = [
  {
    title: 'Convertir PDF',
    description: 'Convierte documentos Office y otros formatos a PDF en segundos.',
    route: '/pdfTools/ConvertidorPDF/ConvertidorPDF',
    icon: 'file-pdf-box',
    iconLibrary: 'MaterialCommunityIcons',
    color: '#ff4a36',
  },
  {
    title: 'Unir PDF',
    description: 'Combina varios archivos en un solo PDF de forma rápida y sencilla.',
    route: '/pdfTools/UnionPDF/UnionPDF',
    icon: 'file-multiple',
    iconLibrary: 'MaterialCommunityIcons',
    color: '#3b82f6',
  },
  {
    title: 'Firmar PDF',
    description: 'Agrega firmas digitales o manuscritas a tus documentos PDF.',
    route: '/pdfTools/FirmarPDF/FirmaPDF',
    icon: 'draw',
    iconLibrary: 'MaterialCommunityIcons',
    color: '#8b5cf6',
  },
  {
    title: 'Comprimir PDF',
    description: 'Reduce el tamaño de tus archivos PDF sin perder calidad.',
    route: '/pdfTools/ComprimidorPDF/ComprimidorPDF',
    icon: 'compress',
    iconLibrary: 'MaterialIcons',
    color: '#10b981',
  },
  {
    title: 'Reparar PDF',
    description: 'Repara archivos PDF dañados o corruptos para recuperar tu información.',
    route: '/pdfTools/RepararPDF/RepararPDF',
    icon: 'file-document-refresh',
    iconLibrary: 'MaterialCommunityIcons',
    color: '#f59e0b',
  },
  {
    title: 'Rotar PDF',
    description: 'Rota las páginas de tu PDF en el ángulo que necesites.',
    route: '/pdfTools/RotarPDF/RotarPDF',
    icon: 'rotate-right',
    iconLibrary: 'MaterialCommunityIcons',
    color: '#ec4899',
  },
];

export default function Home() {
  const router = useRouter();

  const renderIcon = (card: typeof cards[0]) => {
    const IconComponent = card.iconLibrary === 'MaterialCommunityIcons' 
      ? MaterialCommunityIcons 
      : MaterialIcons;
    
    return (
      <View style={[indexStyles.cardIconContainer, { backgroundColor: `${card.color}15` }]}>
        <IconComponent name={card.icon as any} size={36} color={card.color} />
      </View>
    );
  };

  return (
    <ScrollView style={indexStyles.container} contentContainerStyle={indexStyles.scrollContainer}>
      <NadvarIndex />
      <View style={indexStyles.heroContainer}>
        <Text style={indexStyles.heroTitle}>Herramientas online para amantes de los PDF</Text>
        <Text style={indexStyles.heroDescription}>
          Herramientas online y completamente gratuitas para unir PDF, comprimir PDF, convertir documentos Office y otros tipos de documentos o archivos a PDF, implementación de agente inteligente para corrección de PDF. No se necesita instalación.
        </Text>
      </View>
      <View style={indexStyles.cardsContainer}>
        {cards.map((card) => (
          <TouchableOpacity 
            key={card.title} 
            style={indexStyles.card} 
            onPress={() => router.push(card.route as any)}
            activeOpacity={0.7}
          >
            <View style={indexStyles.cardText}>
              <Text style={indexStyles.cardTitle}>{card.title}</Text>
              <Text style={indexStyles.cardDescription}>{card.description}</Text>
            </View>
            {renderIcon(card)}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
