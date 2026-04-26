'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, useFirebase } from './FirebaseProvider';
import { MedicalRecordFormValues } from '@/lib/schemas';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RecordForm } from './RecordForm';
import { Download, FilePlus2, LogOut, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export function Dashboard() {
  const { user, logOut } = useFirebase();
  const [records, setRecords] = useState<(MedicalRecordFormValues & { id: string })[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'records'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
      setRecords(data);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'records');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(records.map(r => ({
      "Numéro du dossier": r.numeroDossier,
      "Nom": r.nom,
      "Prénoms": r.prenoms,
      "Sexe": r.sexe,
      "DDN": r.ddn,
      "Adresse": r.adresse,
      "ATCD Fam CDT": r.atcdFamCdt,
      "ATCD Fam Cancer": r.atcdFamCancer,
      "ATCD Pers Cancer": r.atcdPersCancer,
      "Age du Dgc": r.ageDgc,
      "CDT": r.cdt,
      "Variante": r.variante,
      "∑ ≤ 2 Ou > 2 cm": r.sizeSup2cm,
      "EC": r.ec,
      "Macro ou micro": r.macroMicro,
      "EV < 4 Ou ≥ 4": r.ev,
      "Mitoses < 3 ou ≥ 3": r.mitoses,
      "Hgie": r.hgie,
      "Nse": r.nse,
      "Filet Nerv": r.filetNerv,
      "R": r.r,
      "T": r.t,
      "N": r.n,
      "M": r.m,
      "Chir": r.chir,
      "CG": r.cg,
      "tps": r.tps,
      "Dgc à I1": r.dgcI1,
      "Chir à I1": r.chirI1,
      "Nbre de cures": r.nbreCures,
      "Act Cum": r.actCum,
      "Suivi": r.suivi,
      "Rép à 2 ans": r.rep2ans,
      "Rép à 5 ans": r.rep5ans,
      "Rép à 10 ans": r.rep10ans,
      "DCD": r.dcd,
      "dcd age": r.dcd === 'O' ? r.dcdAge : ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    XLSX.writeFile(wb, "Medical_Records_Export.xlsx");
  };

  const handleSubmit = async (data: MedicalRecordFormValues) => {
    try {
      setSubmitting(true);
      const newId = crypto.randomUUID();
      const payload = {
        ...data,
        userId: user?.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // remove undefined/optional before saving
      delete payload.id;
      
      await setDoc(doc(db, 'records', newId), payload);
      setIsFormOpen(false);
      fetchRecords();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'records');
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce dossier ?')) return;
    try {
      await deleteDoc(doc(db, 'records', id));
      fetchRecords();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `records/${id}`);
    }
  };

  if (isFormOpen) {
    return (
      <div className="flex-1 max-w-5xl mx-auto p-4 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Nouveau Dossier Médical</h1>
          <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Retour</Button>
        </div>
        <RecordForm onSubmit={handleSubmit} isSubmitting={submitting} />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto p-4 w-full space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 md:py-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Patients</h1>
          <p className="text-gray-500">Gérez vos dossiers médicaux.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={logOut} className="gap-2">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Déconnexion</span>
          </Button>
          <Button variant="secondary" onClick={handleExport} className="gap-2 flex-1 sm:flex-none">
            <Download className="h-4 w-4" /> Exporter Excel
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 flex-1 sm:flex-none">
            <FilePlus2 className="h-4 w-4" /> Nouveau
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50/50">
          <FilePlus2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucun dossier</h3>
          <p className="mt-1 text-gray-500">Commencez par créer un nouveau dossier médical.</p>
          <Button className="mt-6" onClick={() => setIsFormOpen(true)}>Créer le premier dossier</Button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>N° Dossier</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénoms</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>CDT</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Diag. I1 (mois)</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-gray-900">{r.numeroDossier || '-'}</TableCell>
                  <TableCell>{r.nom || '-'}</TableCell>
                  <TableCell>{r.prenoms || '-'}</TableCell>
                  <TableCell>{r.sexe}</TableCell>
                  <TableCell>{r.cdt || '-'}</TableCell>
                  <TableCell>{r.variante || '-'}</TableCell>
                  <TableCell>{r.dgcI1} mois</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
