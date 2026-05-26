import { StyleSheet } from 'react-native';
import { authCommonStyles } from './common';

export const loginStyles = {
  ...authCommonStyles,
  ...StyleSheet.create({
    loginError: {
      color: '#ff4a36',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
    },
    linksRow: {
      marginTop: 24,
      alignItems: 'center',
      gap: 14,
    },
    link: {
      paddingVertical: 4,
    },
    linkText: {
      color: '#ff4a36',
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
  }),
};
