import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f8086db72e06453ea7cf6ab3c5377922',
  appName: 'toto-haverim',
  webDir: 'dist',
  server: {
    url: 'https://f8086db7-2e06-453e-a7cf-6ab3c5377922.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;