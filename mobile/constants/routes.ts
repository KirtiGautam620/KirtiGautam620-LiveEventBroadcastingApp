export const ROUTES = {
  browse: '/',
  creator: '/creator',
  viewer: (streamId: string) => `/viewer/${streamId}` as const,
} as const;
