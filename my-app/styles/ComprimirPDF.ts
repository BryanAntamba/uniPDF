import { StyleSheet } from 'react-native';

export const comprimidorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#ff4a36',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  fileContainer: {
    width: '100%',
    backgroundColor: '#f7f7f7',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  fileText: {
    color: '#666666',
    fontSize: 15,
  },
  fileName: {
    marginTop: 8,
    color: '#111111',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  fileSize: {
    marginTop: 4,
    color: '#888888',
    fontSize: 13,
  },
});