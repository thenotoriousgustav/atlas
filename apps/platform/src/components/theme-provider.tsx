'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// ponytail: simplified theme provider wrapping next-themes for clean dark mode configuration
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
