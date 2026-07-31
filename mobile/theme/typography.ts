export const fontSize = {
  micro: 11,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 32,
} as const;

export const lineHeight = {
  micro: 14,
  xs: 16,
  sm: 20,
  base: 24,
  lg: 26,
  xl: 28,
  xxl: 32,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Composed presets — what components actually use. Hierarchy: Section
// titles (heading1) are large/bold, card titles (heading2) are semibold,
// usernames are medium, secondary labels (caption) are regular.
export const typography = {
  display: {
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    fontWeight: fontWeight.bold,
  },
  heading1: { fontSize: fontSize.xxl, lineHeight: lineHeight.xxl, fontWeight: fontWeight.bold },
  heading2: { fontSize: fontSize.xl, lineHeight: lineHeight.xl, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.base, lineHeight: lineHeight.base, fontWeight: fontWeight.regular },
  bodyStrong: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.semibold,
  },
  username: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, fontWeight: fontWeight.medium },
  caption: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, fontWeight: fontWeight.regular },
  label: { fontSize: fontSize.xs, lineHeight: lineHeight.xs, fontWeight: fontWeight.medium },
  micro: {
    fontSize: fontSize.micro,
    lineHeight: lineHeight.micro,
    fontWeight: fontWeight.regular,
  },
} as const;
