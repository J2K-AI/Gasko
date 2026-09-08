export const Colors = {
  primary: '#16A34A',       // verde gasolinera
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  secondary: '#F59E0B',     // ámbar para precios
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  overlay: 'rgba(0,0,0,0.4)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  price: { fontSize: 18, fontWeight: '700' as const, color: Colors.secondary },
};
