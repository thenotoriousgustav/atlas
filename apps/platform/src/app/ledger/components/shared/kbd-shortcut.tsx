import React from 'react';

interface KbdShortcutProps {
  children: React.ReactNode;
  className?: string;
}

export function KbdShortcut({ children, className = '' }: KbdShortcutProps) {
  return (
    <kbd
      className={`inline-flex items-center justify-center rounded border border-[#EAEAEA] bg-[#F7F6F3] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#787774] shadow-2xs ${className}`}
    >
      {children}
    </kbd>
  );
}
