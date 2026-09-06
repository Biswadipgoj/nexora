import type { MetadataRoute } from 'next';

/**
 * Web app manifest — Master Design Document, section 8.
 *
 * The launcher and installable icons are generated from the single master mark
 * in public/logo.svg by scripts/generate-icons.mjs, so the brand does not
 * change between web, Windows and Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexora — Project and Task Management',
    short_name: 'Nexora',
    description: 'A calm command center for planning, tracking and shipping work.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    // The application canvas (--nx-bg), so the splash and system chrome match
    // the obsidian shell rather than flashing white on launch.
    background_color: '#F8FAFC',
    theme_color: '#F8FAFC',
    categories: ['productivity', 'business'],
    icons: [
      { src: '/android-chrome-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Maskable variants bleed to the edge, so Android's adaptive crop cannot
      // notch the tile's rounded corners.
      { src: '/android-chrome-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/android-chrome-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
