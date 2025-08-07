import { useState } from 'react';

type LayoutType = 'card' | 'table';

export const useLayoutPreference = (key: string, defaultLayout: LayoutType = 'card') => {
  const [layout, setLayout] = useState<LayoutType>(() => {
    try {
      const saved = localStorage.getItem(`layout-${key}`);
      return (saved as LayoutType) || defaultLayout;
    } catch {
      return defaultLayout;
    }
  });

  const updateLayout = (newLayout: LayoutType) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(`layout-${key}`, newLayout);
    } catch {
      // Ignore localStorage errors
    }
  };

  return [layout, updateLayout] as const;
};