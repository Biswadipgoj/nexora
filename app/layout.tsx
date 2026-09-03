import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXORA — Work. Plan. Build. Live.',
  description:
    'A unified work-and-life management platform. Jira\'s power without Jira\'s unnecessary complexity. One engine for professional work and personal productivity.',
  keywords: [
    'project management',
    'task management',
    'work management',
    'personal productivity',
    'kanban',
    'sprint planning',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFBFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1117' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* §32: Skip to content link for keyboard/screen reader users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
