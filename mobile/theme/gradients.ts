// expo-linear-gradient's `colors` prop wants a fixed-length tuple, so every
// gradient here is `as const` rather than typed as a plain string array.

// Full-bleed video/preview backdrop — a subtle dark diagonal, not flat black.
export const stageGradient = ['#26262B', '#1E1E22', '#121212'] as const;

// Behind hero/preview cards (Creator idle state) — a soft accent-purple
// wash fading into the surface, not a loud full-saturation fill.
export const heroGradient = ['rgba(139, 92, 246, 0.35)', '#26262B', '#121212'] as const;

// Legibility scrims for floating chrome over video content.
export const scrimTopGradient = ['rgba(10, 10, 12, 0.65)', 'transparent'] as const;
export const scrimBottomGradient = ['transparent', 'rgba(10, 10, 12, 0.9)'] as const;

export const gradients = {
  stage: stageGradient,
  hero: heroGradient,
  scrimTop: scrimTopGradient,
  scrimBottom: scrimBottomGradient,
} as const;

// Rotating set of accent-derived thumbnail gradients for Browse stream
// cards — varied enough that a grid of cards doesn't read as one repeated
// tile, built only from the app's own accent palette (purple/pink/blue/
// emerald), not arbitrary colors.
const THUMBNAIL_GRADIENTS = [
  ['#8B5CF6', '#4C2E9A'],
  ['#EC4899', '#9D2361'],
  ['#3B82F6', '#1E3A8A'],
  ['#10B981', '#065F46'],
  ['#8B5CF6', '#EC4899'],
  ['#3B82F6', '#10B981'],
] as const;

export function thumbnailGradient(index: number): readonly [string, string] {
  return THUMBNAIL_GRADIENTS[index % THUMBNAIL_GRADIENTS.length] ?? THUMBNAIL_GRADIENTS[0];
}
