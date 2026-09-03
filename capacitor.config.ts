import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for NEXORA (Android & Web).
 * §42: Shared cross-platform architecture — identical codebase powers web and native Android.
 *
 * For native Android:
 * - In local development: server.url points to your dev machine (e.g., http://10.0.2.2:3000 for Android Emulator
 *   or your LAN IP http://192.168.x.x:3000 for physical devices) with live reload.
 * - In production: server.url points to your deployed NEXORA domain (e.g. https://nexora.app).
 */
const config: CapacitorConfig = {
  appId: 'com.nexora.app',
  appName: 'NEXORA',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // When testing live dev server on Android emulator or device, uncomment:
    // url: 'http://10.0.2.2:3000',
  },
  android: {
    backgroundColor: '#FAFBFC',
    allowMixedContent: true,
  },
};

export default config;
