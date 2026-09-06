import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { NexoraMuiTheme } from '@/components/theme/NexoraMuiTheme';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Nexora — Project and Task Management',
    template: '%s — Nexora',
  },
  description: 'A calm command center for planning, tracking and shipping work.',
  applicationName: 'Nexora',
  keywords: [
    'project management',
    'task management',
    'work management',
    'kanban',
    'sprint planning',
  ],
  // Icons resolve from the app-directory file conventions — app/favicon.ico,
  // app/icon.svg and app/apple-icon.png — all generated from the single master
  // mark by scripts/generate-icons.mjs (section 8). The file-based API is used
  // in preference to an explicit `icons` object so the metadata cannot drift
  // out of sync with the artwork on disk. Launcher icons are in app/manifest.ts.
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Section 9: text must stay legible at 200% zoom, so pinch-zoom is not capped.
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#F8FAFC',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <NexoraMuiTheme>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <div id="main-content">{children}</div>
          </NexoraMuiTheme>
        </ThemeProvider>
      </body>
    </html>
  );
}
