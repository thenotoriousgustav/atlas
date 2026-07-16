import './globals.css';
import { Providers } from './providers';
import React from 'react';
import { Instrument_Serif, Inter } from 'next/font/google';
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@atlas/ui/components/sonner';

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
});

export const metadata = {
  title: 'Cabinet — Gustam Platform',
  description: 'Personal bookmark manager and file organizer.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ponytail: theme provider wrapping providers at html root level to enable class-based dark mode
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`${instrumentSerif.variable} bg-brand-canvas text-brand-charcoal antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
