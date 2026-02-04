import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'az.bitig.app',
  appName: 'Bitig',
  webDir: 'public',
  server: {
    url: 'https://bitig.az',
    androidScheme: 'https'
  }
};

export default config;
