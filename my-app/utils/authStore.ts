const users: Record<string, string> = {
  'usuario@gmail.com': 'password123',
  'admin@unipdf.com': 'admin123',
};

export const isRegistered = (email: string) => {
  const key = email.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(users, key);
};

export const verifyCredentials = (email: string, password: string) => {
  const key = email.trim().toLowerCase();
  return users[key] === password;
};

export const getStoredPassword = (email: string) => users[email.trim().toLowerCase()];

export const updatePassword = (email: string, newPassword: string) => {
  const key = email.trim().toLowerCase();
  users[key] = newPassword;
  return true;
};

export const registerUser = (email: string, password: string) => {
  const key = email.trim().toLowerCase();
  if (users[key]) return false;
  users[key] = password;
  return true;
};
