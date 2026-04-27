import type {Metadata} from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FORMULAIRE CDT',
  description: 'Formulaire médical pour le suivi du cancer de la thyroïde',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn(inter.className, "font-sans", geist.variable)}>
      <head>
        <meta name="application-name" content="FormCDT" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FormCDT" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
