export {};

declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      /** Synchronous - safe to call before first paint to avoid a theme flash. */
      getInitialTheme: () => 'light' | 'dark' | null;
      setTheme: (theme: 'light' | 'dark') => void;
    };
  }
}
