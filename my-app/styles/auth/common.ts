import { StyleSheet } from 'react-native';

export const authCommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  backLink: {
    alignSelf: 'flex-start',
    marginTop: 23,
    marginBottom: 20,
    paddingVertical: 4,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  backLinkText: {
    color: '#ff4a36',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#111111',
  },
  inputError: {
    borderColor: '#ff4a36',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111111',
  },
  eyeButton: {
    padding: 8,
  },
  fieldError: {
    color: '#ff4a36',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
  },
  button: {
    width: '100%',
    backgroundColor: '#ff4a36',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
