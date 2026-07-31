import { colors, palette } from './colors';
import { gradients } from './gradients';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontSize, fontWeight, lineHeight, typography } from './typography';

export const darkTheme = {
  colors,
  palette,
  gradients,
  typography,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof darkTheme;
