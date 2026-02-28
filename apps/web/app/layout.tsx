import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundaryClient';
import '../styles/tamagui.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Innera',
  description: 'Private journaling for the soul',
  keywords: ['journal', 'journaling', 'mental health', 'wellness', 'mindfulness'],
  authors: [{ name: 'Innera' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1A1A' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning style={{ height: '100%' }}>
      <body style={{ fontFamily: 'var(--font-inter), sans-serif', margin: 0, height: '100%', display: 'flex', flexDirection: 'row' }} suppressHydrationWarning>
        <Providers>
          <Sidebar />
          <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </Providers>
      </body>
    </html>
  );
}
