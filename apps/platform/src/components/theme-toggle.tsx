'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@atlas/ui/components/button';
import { Sun, Moon } from '@phosphor-icons/react';

// ponytail: single click cycle theme button to avoid complex menu boilerplates
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="size-8 p-0 rounded-none border-brand-border"
        disabled
      >
        <span className="size-3.5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="size-8 p-0 rounded-none border-brand-border flex items-center justify-center text-brand-charcoal"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="size-3.5" />
      ) : (
        <Moon className="size-3.5" />
      )}
    </Button>
  );
}
