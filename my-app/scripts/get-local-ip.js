#!/usr/bin/env node

/**
 * Script para obtener la IP local de la máquina
 * Útil para configurar el archivo .env automáticamente
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Priorizar interfaces WiFi y Ethernet
  const priorityNames = ['Wi-Fi', 'WiFi', 'Ethernet', 'en0', 'eth0', 'wlan0'];
  
  // Primero buscar en interfaces prioritarias
  for (const name of priorityNames) {
    if (interfaces[name]) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  
  // Si no se encuentra, buscar en todas las interfaces
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

function updateEnvFile(ip) {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  const newUrl = `http://${ip}:3000`;
  const envContent = `# Configuración del Backend
# Cambia esta IP según tu red local
EXPO_PUBLIC_API_URL=${newUrl}

# Para producción, usa una URL real:
# EXPO_PUBLIC_API_URL=https://tu-servidor.com
`;

  // Crear .env si no existe (copiando de .env.example)
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Archivo .env creado desde .env.example');
    }
  }
  
  // Actualizar .env con la nueva IP
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Archivo .env actualizado');
}

function main() {
  console.log('🔍 Detectando IP local...\n');
  
  const ip = getLocalIP();
  
  console.log('📍 IP local detectada:', ip);
  console.log('🌐 URL del backend:', `http://${ip}:3000\n`);
  
  // Preguntar si desea actualizar el .env
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('¿Deseas actualizar el archivo .env con esta IP? (s/n): ', (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'si') {
      updateEnvFile(ip);
      console.log('\n✨ Configuración completada!');
      console.log('📝 Puedes editar manualmente el archivo .env si es necesario\n');
    } else {
      console.log('\n📝 No se realizaron cambios. Puedes actualizar .env manualmente:');
      console.log(`   EXPO_PUBLIC_API_URL=http://${ip}:3000\n`);
    }
    readline.close();
  });
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { getLocalIP };
