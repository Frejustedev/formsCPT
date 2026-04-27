'use client';

import { useFirebase } from '@/components/FirebaseProvider';
import { Stethoscope, LayoutDashboard, PlusCircle, ShieldAlert, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, signInWithGoogle, logOut } = useFirebase();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50/50 dark:bg-gray-950/50 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none text-center space-y-6 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-blue-50/50 dark:ring-blue-900/20">
            <Stethoscope className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Registre Cancer</h1>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm px-2">
              Plateforme sécurisée pour le suivi médical des cancers thyroïdiens.
            </p>
          </div>
          <div className="pt-6">
            <Button size="lg" className="w-full h-12 text-md shadow-md dark:shadow-none hover:shadow-lg transition-all" onClick={signInWithGoogle}>
              Se connecter avec Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: 'Tableau de bord', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Nouveau dossier', href: '/records/new', icon: <PlusCircle className="w-5 h-5" /> },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Administration', href: '/admin', icon: <ShieldAlert className="w-5 h-5" /> });
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm z-10 transition-all">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Registre CDT</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'}`}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold truncate dark:text-gray-200">{user.displayName || 'Utilisateur'}</span>
              <span className="text-xs text-gray-500 truncate dark:text-gray-400">{user.email}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={logOut} className="flex-1 gap-2 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
              <LogOut className="w-4 h-4" /> Quitter
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Navbar */}
      <div className="md:hidden flex flex-col w-full h-full">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Registre CDT</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {mobileMenuOpen && (
          <div className="absolute top-[65px] left-0 right-0 bottom-0 bg-white dark:bg-gray-900 z-20 flex flex-col animate-in fade-in slide-in-from-top-2">
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2 text-base font-medium">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )
              })}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-semibold truncate dark:text-gray-200">{user.displayName || 'Utilisateur'}</span>
                  <span className="text-sm text-gray-500 truncate dark:text-gray-400">{user.email}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <ThemeToggle />
                <Button variant="outline" onClick={logOut} className="flex-1 gap-2 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto w-full relative">
          {children}
        </main>
      </div>

      <main className="hidden md:block flex-1 overflow-y-auto w-full relative">
        {children}
      </main>
    </div>
  );
}
