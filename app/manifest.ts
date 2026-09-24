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
    name: 'Nexora — Projects and tasks, on one board',
    short_name: 'Nexora',
    description: 'Plan the work, see it move, and finish it together.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    // The application canvas (--nx-canvas), so the splash and system chrome
    // match the app rather than flashing a different colour on launch.
    background_color: '#F2F2EE',
    theme_color: '#F2F2EE',
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
