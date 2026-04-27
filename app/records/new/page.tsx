'use client';

import { RecordForm } from '@/components/RecordForm';
import {
  handleFirestoreError,
  OperationType,
  useFirebase,
  logAction,
  isNumeroDossierTaken,
  createMedicalRecord,
} from '@/components/FirebaseProvider';
import { MedicalRecordFormValues } from '@/lib/schemas';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewRecordPage() {
  const { user } = useFirebase();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: MedicalRecordFormValues) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }
    try {
      setSubmitting(true);
      if (await isNumeroDossierTaken(data.numeroDossier)) {
        toast.error(`Le numéro de dossier ${data.numeroDossier} existe déjà`);
        return;
      }
      const newId = crypto.randomUUID();
      await createMedicalRecord(newId, data, user.uid);
      toast.success('Nouveau dossier créé avec succès');
      logAction('CREATE_RECORD', `Dossier N° ${data.numeroDossier || newId} créé.`);
      router.push('/');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'records');
      toast.error('Erreur lors de la création du dossier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-primary font-medium mb-1 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Nouveau dossier médical
          </h1>
        </div>
      </div>
      <RecordForm onSubmit={handleSubmit} onCancel={() => router.push('/')} isSubmitting={submitting} />
    </div>
  );
}
