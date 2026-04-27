import type { Metadata, Viewport } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { Toaster } from '@/components/ui/sonner';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { AppShell } from '@/components/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Registre Cancer Thyroïde',
  description: 'Application de registre des cancers différenciés de la thyroïde',
  applicationName: 'Registre CDT',
  appleWebApp: {
    capable: true,
    title: 'Registre CDT',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn(inter.className, 'font-sans', geist.variable)} suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 min-h-screen" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <AppShell>{children}</AppShell>
              <PWAInstallPrompt />
              <Toaster position="top-right" />
            </ThemeProvider>
          </FirebaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
