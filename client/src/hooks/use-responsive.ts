import { useState, useEffect } from 'react';

export interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive(breakpoints: BreakpointConfig = defaultBreakpoints) {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize.width < breakpoints.md;
  const isTablet = screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg;
  const isDesktop = screenSize.width >= breakpoints.lg;
  const isLargeDesktop = screenSize.width >= breakpoints.xl;

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    breakpoint: {
      sm: screenSize.width >= breakpoints.sm,
      md: screenSize.width >= breakpoints.md,
      lg: screenSize.width >= breakpoints.lg,
      xl: screenSize.width >= breakpoints.xl,
      '2xl': screenSize.width >= breakpoints['2xl'],
    },
  };
}

export function useBreakpoint(size: keyof BreakpointConfig) {
  const { breakpoint } = useResponsive();
  return breakpoint[size];
}