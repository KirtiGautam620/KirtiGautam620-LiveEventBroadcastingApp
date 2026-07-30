export interface MockStream {
  id: string;
  title: string;
  category: string;
  creatorName: string;
  viewerCount: number;
}

// Static UI fixture data — not the real Stream type from types/database.ts,
// and no repository call. Swap for streamRepository.listLive() once live
// data wiring lands; kept deliberately separate so this step stays UI-only.
export const MOCK_STREAMS: MockStream[] = [
  {
    id: 'midnight-mix',
    title: 'Late Night Beats & Chill',
    category: 'Music',
    creatorName: 'DJ Nova',
    viewerCount: 4300,
  },
  {
    id: 'ranked-grind',
    title: 'Ranked Grind to Diamond',
    category: 'Gaming',
    creatorName: 'PixelQueen',
    viewerCount: 2870,
  },
  {
    id: 'studio-sketch',
    title: 'Digital Painting Live',
    category: 'Art',
    creatorName: 'InkWell',
    viewerCount: 951,
  },
  {
    id: 'street-eats',
    title: 'Street Food Tour: Bangkok',
    category: 'Food',
    creatorName: 'ChefRomi',
    viewerCount: 6120,
  },
  {
    id: 'morning-flow',
    title: 'Sunrise Yoga Flow',
    category: 'Fitness',
    creatorName: 'Kaia Moves',
    viewerCount: 733,
  },
  {
    id: 'build-along',
    title: 'Building a Synth From Scratch',
    category: 'Tech',
    creatorName: 'CircuitJo',
    viewerCount: 1489,
  },
  {
    id: 'open-mic',
    title: 'Open Mic Comedy Hour',
    category: 'Comedy',
    creatorName: 'Marcus Wilde',
    viewerCount: 2204,
  },
  {
    id: 'city-walk',
    title: 'Tokyo Night Walk',
    category: 'Travel',
    creatorName: 'Wander Erin',
    viewerCount: 3567,
  },
];
