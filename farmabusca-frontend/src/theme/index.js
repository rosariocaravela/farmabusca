export const colors = {
  primary: '#16A34A', primaryDark: '#166534', primaryLight: '#DCFCE7',
  primaryMuted: '#F0FDF4', support: '#2563EB', background: '#EEF5F1', surface: '#FFFFFF',
  surfaceMuted: '#F1F5F3', text: '#10231A', textSecondary: '#62706A', border: '#DDE6E1',
  warning: '#F59E0B', warningLight: '#FEF3C7', error: '#DC2626',
  errorLight: '#FEE2E2', successLight: '#DCFCE7', disabled: '#CBD5E1',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const typography = {
  display: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.7 },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '700', letterSpacing: -0.35 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 18 },
};
export const shadows = {
  card: { shadowColor: '#163C28', shadowOpacity: 0.045, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  floating: { shadowColor: '#10231A', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 7 },
};
export const theme = { colors, spacing, radius, typography, shadows };

export const navigationTheme = {
  dark: false,
  colors: { primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, notification: colors.error },
};
