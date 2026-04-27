'use client';

import { RecordForm } from '@/components/RecordForm';
import {
  handleFirestoreError,
  OperationType,
  useFirebase,
  db,
  logAction,
  isNumeroDossierTaken,
  updateMedicalRecord,
} from '@/components/FirebaseProvider';
import { MedicalRecordFormValues, StoredMedicalRecord } from '@/lib/schemas';
import { migrateStoredRecord } from '@/lib/migrate';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EditRecordPage() {
  const { user } = useFirebase();
  const router = useRouter();
  const params = useParams();
  const recordId = params?.id as string | undefined;

  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<StoredMedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) return;
    let cancelled = false;
    async function fetchRecord() {
      try {
        const docRef = doc(db, 'records', recordId as string);
        const docSnap = await getDoc(docRef);
        if (cancelled) return;
        if (docSnap.exists()) {
          setRecord(migrateStoredRecord(docSnap.id, docSnap.data() as Record<string, unknown>));
        } else {
          toast.error("Ce dossier n'existe pas");
          router.push('/');
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `records/${recordId}`);
        toast.error('Erreur lors du chargement du dossier');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRecord();
    return () => { cancelled = true; };
  }, [recordId, router]);

  const handleSubmit = async (data: MedicalRecordFormValues) => {
    if (!recordId || !user) return;
    try {
      setSubmitting(true);
      if (record && data.numeroDossier !== record.numeroDossier) {
        if (await isNumeroDossierTaken(data.numeroDossier, recordId)) {
          toast.error(`Le numéro de dossier ${data.numeroDossier} est déjà utilisé`);
          return;
        }
      }
      await updateMedicalRecord(recordId, data, user.uid, user.email || '');
      toast.success('Dossier mis à jour avec succès');
      logAction('UPDATE_RECORD', `Dossier N° ${data.numeroDossier || recordId} mis à jour.`);
      router.push('/');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `records/${recordId}`);
      toast.error('Erreur lors de la mise à jour du dossier');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full animate-in fade-in duration-500 pb-24">
        <div className="flex flex-col items-center justify-center h-64 border rounded-2xl bg-white dark:bg-gray-950 shadow-sm gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

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
            Modifier le dossier : {record?.numeroDossier || 'Non défini'}
          </h1>
        </div>
      </div>
      {record && (
        <RecordForm
          initialValues={record}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/')}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}
