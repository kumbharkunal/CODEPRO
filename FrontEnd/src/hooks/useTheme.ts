import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTheme } from '@/store/slices/themeSlice';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme.mode);

  useEffect(() => {
    // Apply theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setDarkMode = () => dispatch(setTheme('dark'));
  const setLightMode = () => dispatch(setTheme('light'));

  return {
    theme,
    isDark: theme === 'dark',
    setDarkMode,
    setLightMode,
  };
};