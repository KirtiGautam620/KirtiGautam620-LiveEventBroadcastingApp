// Raw color primitives. Components should not reference this directly —
// use the semantic `colors` export below so the palette can be retuned
// without touching every screen.
export const palette = {
  neutral950: '#0A0A0F',
  neutral900: '#121218',
  neutral800: '#1C1C24',
  neutral700: '#2A2A35',
  neutral600: '#3F3F4B',
  neutral500: '#5C5C6B',
  neutral400: '#8A8A99',
  neutral300: '#B4B4C0',
  neutral200: '#D9D9E0',
  neutral100: '#EDEDF2',
  neutral50: '#F7F7FA',
  accent: '#6C5CE7',
  accentMuted: '#4B3FA0',
  live: '#FF4B4B',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export const colors = {
  background: palette.neutral950,
  surface: palette.neutral900,
  surfaceElevated: palette.neutral800,
  border: palette.neutral700,
  textPrimary: palette.neutral50,
  textSecondary: palette.neutral400,
  textMuted: palette.neutral500,
  accent: palette.accent,
  accentMuted: palette.accentMuted,
  live: palette.live,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;
