import { createContext, useContext, type PropsWithChildren } from 'react';

import { darkTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(darkTheme);

// Only one theme exists today, but consumers read it through useTheme()
// rather than importing darkTheme directly — adding a second theme or
// system-based switching later only changes this file, not every screen.
export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={darkTheme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
