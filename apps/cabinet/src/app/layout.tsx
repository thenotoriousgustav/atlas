import './globals.css';
import { Providers } from './providers';
import React from 'react';
import { Instrument_Serif } from 'next/font/google';

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${instrumentSerif.variable} bg-brand-canvas text-brand-charcoal antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
