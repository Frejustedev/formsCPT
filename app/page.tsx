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
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">MedTracker PWA</h1>
          <p className="text-gray-500">
            Une application web pour remplir et exporter vos fiches de suivi médical facilement.
          </p>
          <div className="pt-4">
            <Button size="lg" className="w-full" onClick={signInWithGoogle}>
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
