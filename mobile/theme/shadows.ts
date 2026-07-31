import { Platform } from 'react-native';

// iOS and Android have unrelated shadow APIs (shadow* props vs elevation) —
// bundling the platform branch into the token means components just spread
// theme.shadows.md instead of each re-deriving Platform.OS checks.
//
// Softer, wider, lower-opacity than a typical default — on layered dark
// surfaces (background/surface/elevated), a soft diffuse shadow reads as
// "premium elevation" while a tight high-opacity one reads as a harsh cutout.
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
    },
    android: { elevation: 10 },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 28,
    },
    android: { elevation: 16 },
    default: {},
  }),
} as const;
