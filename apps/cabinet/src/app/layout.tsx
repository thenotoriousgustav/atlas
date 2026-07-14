import './globals.css';
import { Providers } from './providers';
import React from 'react';
import { Instrument_Serif, Inter } from 'next/font/google';
import { cn } from "@/lib/utils";

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
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`${instrumentSerif.variable} bg-brand-canvas text-brand-charcoal antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
