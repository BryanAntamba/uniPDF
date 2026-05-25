import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { navStyles } from '@/styles/NadvarIndex';

type NavbarRoute =
  | '/'
  | '/ConvertidorPDF/ConvertidorPDF'
  | '/UnionPDF/UnionPDF'
  | '/FirmarPDF/FirmaPDF'
  | '/ComprimidorPDF/ComprimidorPDF'
  | '/(auth)/Login';

const menuItems: Array<{ label: string; route: NavbarRoute }> = [
  { label: 'Inicio', route: '/' },
  { label: 'Convertir PDF', route: '/ConvertidorPDF/ConvertidorPDF' },
  { label: 'Unir PDF', route: '/UnionPDF/UnionPDF' },
  { label: 'Firmar PDF', route: '/FirmarPDF/FirmaPDF' },
  { label: 'Comprimir PDF', route: '/ComprimidorPDF/ComprimidorPDF' },
  { label: 'Iniciar Sesion', route: '/(auth)/Login' },
];

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return <Text style={navStyles.closeIcon}>✕</Text>;
  }

  return (
    <View style={navStyles.hamburger}>
      <View style={navStyles.hamburgerLine} />
      <View style={navStyles.hamburgerLine} />
      <View style={navStyles.hamburgerLine} />
    </View>
  );
}

export default function NadvarIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(insets.top + 64);

  const goTo = (route: NavbarRoute) => {
    setMenuOpen(false);
    if (route === '/') {
      router.replace('/');
      return;
    }
    router.push(route);
  };

  const navbarStyle = [navStyles.navbar, { paddingTop: insets.top + 12 }];

  return (
    <View style={navStyles.wrapper}>
      <View
        style={navbarStyle}
        onLayout={(e) => setNavbarHeight(e.nativeEvent.layout.height)}
      >
        <Image source={require('@/assets/images/TituloPrincipal.png')} style={navStyles.logo} resizeMode="contain" />
        <TouchableOpacity
          onPress={() => setMenuOpen((prev) => !prev)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <MenuIcon open={menuOpen} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={[navStyles.menuDropdown, { top: navbarHeight }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[navStyles.menuItem, index === menuItems.length - 1 && navStyles.menuItemLast]}
              onPress={() => goTo(item.route)}
            >
              <Text style={navStyles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
