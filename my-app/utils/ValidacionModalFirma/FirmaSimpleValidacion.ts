/**
 * Validación para campos de firma simple
 * Solo permite letras (incluyendo acentos y ñ), espacios y guiones
 * No permite números ni caracteres especiales
 */

type ValidationResult = {
  texto: string;
  error: string;
};

/**
 * Valida y limpia el campo de nombre
 * Permite: letras (a-z, A-Z), letras con acentos (á, é, í, ó, ú, ñ), espacios y guiones
 * No permite: números, caracteres especiales (@, #, $, %, etc.)
 */
export const validarNombre = (texto: string): ValidationResult => {
  // Permitir solo letras (incluyendo acentos y ñ), espacios y guiones
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]*$/;
  
  if (!regex.test(texto)) {
    // Filtrar caracteres no permitidos
    const textoLimpio = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]/g, '');
    return {
      texto: textoLimpio,
      error: 'Solo se permiten letras, espacios y guiones',
    };
  }

  // Validar longitud máxima
  if (texto.length > 50) {
    return {
      texto: texto.substring(0, 50),
      error: 'El nombre no puede exceder 50 caracteres',
    };
  }

  return {
    texto,
    error: '',
  };
};

/**
 * Valida y limpia el campo de iniciales
 * Permite: solo letras (a-z, A-Z) y letras con acentos
 * No permite: números, espacios, caracteres especiales
 */
export const validarIniciales = (texto: string): ValidationResult => {
  // Permitir solo letras (incluyendo acentos y ñ), sin espacios
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]*$/;
  
  if (!regex.test(texto)) {
    // Filtrar caracteres no permitidos (incluyendo espacios)
    const textoLimpio = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, '');
    return {
      texto: textoLimpio,
      error: 'Solo se permiten letras, sin espacios ni números',
    };
  }

  // Validar longitud máxima (generalmente 2-5 caracteres para iniciales)
  if (texto.length > 5) {
    return {
      texto: texto.substring(0, 5),
      error: 'Las iniciales no pueden exceder 5 caracteres',
    };
  }

  return {
    texto,
    error: '',
  };
};

/**
 * Valida que al menos uno de los campos (nombre o iniciales) tenga contenido
 */
export const validarCamposCompletos = (nombre: string, iniciales: string): boolean => {
  return nombre.trim().length > 0 || iniciales.trim().length > 0;
};
