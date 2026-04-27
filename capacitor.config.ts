import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.registrecdt.app',
  appName: 'Registre CDT',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      androidIsEncryption: false,
    },
  },
};

export default config;
