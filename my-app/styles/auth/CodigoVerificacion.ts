import { StyleSheet } from 'react-native';
import { authCommonStyles } from './common';

export const codigoStyles = {
  ...authCommonStyles,
  ...StyleSheet.create({
    codeInput: {
      letterSpacing: 8,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
    },
  }),
};
