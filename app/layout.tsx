import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from 'next/font/google';
import './globals.css';
import { NexoraMuiTheme } from '@/components/theme/NexoraMuiTheme';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/theme/ThemeProvider';

/**
 * Type: Newsreader, a literary serif, carries page titles and headlines;
 * IBM Plex Sans, an engineered grotesk with true tabular figures, carries the
 * interface; IBM Plex Mono sets item keys and shortcuts.
 */
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Nexora — Projects and tasks, on one board',
    template: '%s — Nexora',
  },
  description: 'Plan the work, see it move, and finish it together. Boards, a focus list and an inbox for small teams.',
  applicationName: 'Nexora',
  keywords: ['project management', 'task management', 'kanban', 'team planning'],
  // Icons resolve from app/favicon.ico, app/icon.svg and app/apple-icon.png,
  // generated from public/logo.svg by scripts/generate-icons.mjs.
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Text must stay legible at 200% zoom, so pinch-zoom is not capped.
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F2EE' },
    { media: '(prefers-color-scheme: dark)', color: '#121311' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
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
