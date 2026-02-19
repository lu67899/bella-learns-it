import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bellaestuda',
  appName: 'Bella Space',
  webDir: 'dist',
  // server: {
  //   url: 'https://80319d5d-d90f-48b9-a65e-3ebce5a3c0cb.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,   // ← permite HTTP streams (IPTV http://)
    webContentsDebuggingEnabled: false,
  },
};

export default config;
