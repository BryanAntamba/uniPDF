const LOGIN_EMAIL_REGEX = /^[^\s@]+@(gmail\.com|unipdf\.com)$/i;
const GMAIL_ONLY_REGEX = /^[^\s@]+@gmail\.com$/i;

export const validateLoginEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return 'El correo no puede estar vacío.';
  if (!LOGIN_EMAIL_REGEX.test(trimmed)) {
    return 'Usa un correo @gmail.com o @unipdf.com válido.';
  }
  return null;
};

export const validateGmailEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return 'El correo no puede estar vacío.';
  if (!GMAIL_ONLY_REGEX.test(trimmed)) {
    return 'Ingresa un correo con formato @gmail.com (ej: usuario@gmail.com).';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'La contraseña no puede estar vacía.';
  return null;
};

export const validateVerificationCode = (code: string): string | null => {
  const trimmed = code.trim();
  if (!trimmed) return 'El código no puede estar vacío.';
  if (!/^\d{6}$/.test(trimmed)) return 'Ingresa un código de 6 dígitos numéricos.';
  return null;
};

export const validateConfirmPassword = (password: string, confirm: string): string | null => {
  const passwordError = validatePassword(confirm);
  if (passwordError) return passwordError;
  if (password !== confirm) return 'Las contraseñas no coinciden.';
  return null;
};
