import { StyleSheet } from 'react-native';

export const navStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    zIndex: 100,
    elevation: 100,
  },
  navbar: {
    width: '100%',
    backgroundColor: '#ff4a36',
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 140,
    height: 36,
  },
  hamburger: {
    width: 26,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 26,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  closeIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 28,
    width: 26,
    textAlign: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 102,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '600',
  },
});
