'use client';

import { FirebaseProvider, useFirebase } from '@/components/FirebaseProvider';
import { Dashboard } from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';

function AppContent() {
  const { user, loading, signInWithGoogle } = useFirebase();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50/50">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 text-center space-y-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
            <Stethoscope className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">MedTracker</h1>
            <p className="text-gray-500 leading-relaxed text-sm px-2">
              Une plateforme moderne et sécurisée pour gérer, structurer et exporter vos dossiers de suivi médical en toute simplicité.
            </p>
          </div>
          <div className="pt-6">
            <Button size="lg" className="w-full h-12 text-md shadow-md hover:shadow-lg transition-all" onClick={signInWithGoogle}>
              Se connecter avec Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default function Page() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
