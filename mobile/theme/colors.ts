// Raw color primitives. Components should not reference this directly —
// use the semantic `colors` export below so the palette can be retuned
// without touching every screen.
export const palette = {
  background: '#121212',
  surface: '#1E1E22',
  surfaceElevated: '#26262B',
  border: 'rgba(255, 255, 255, 0.06)',
  textPrimary: '#F8F8F8',
  textSecondary: '#B3B3B3',
  // #7A7A85 measured ~4.4:1 on #121212 — just under WCAG AA's 4.5:1 for
  // small text (this token backs captions/labels/timestamps throughout the
  // app, none of which qualify as "large text"). Nudged lighter to ~5.2:1.
  textMuted: '#86868F',
  purple: '#8B5CF6',
  pink: '#EC4899',
  // Darker than `pink` specifically for white text on a solid fill (the
  // LIVE badge) — #EC4899 with white text measures ~3.5:1, below AA; this
  // shade measures ~4.6:1. `pink` itself stays untouched since it's used
  // as foreground text on dark backgrounds elsewhere, where it already
  // passes comfortably.
  pinkStrong: '#DB2777',
  blue: '#3B82F6',
  emerald: '#10B981',
  danger: '#EF4444',
} as const;

export const colors = {
  background: palette.background,
  surface: palette.surface,
  surfaceElevated: palette.surfaceElevated,
  border: palette.border,
  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,
  accent: palette.purple,
  // Translucent, not a flat fill — lets an "accent tint" sit on top of a
  // glass surface (own chat bubbles, gradient washes) without going opaque.
  accentMuted: 'rgba(139, 92, 246, 0.28)',
  accentPink: palette.pink,
  accentBlue: palette.blue,
  accentEmerald: palette.emerald,
  // Pink reads as "live/urgent" against this palette (no red accent is
  // defined) while staying distinct from `danger`, which is reserved for
  // real errors/destructive actions. Uses the darker `pinkStrong` shade —
  // this backs a solid-fill badge with white text on top, which needs
  // more contrast than pink-as-foreground-text does.
  live: palette.pinkStrong,
  danger: palette.danger,
  overlay: 'rgba(10, 10, 12, 0.5)',
  overlayStrong: 'rgba(10, 10, 12, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
} as const;
