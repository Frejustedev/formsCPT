'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, useFirebase } from './FirebaseProvider';
import { MedicalRecordFormValues } from '@/lib/schemas';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RecordForm } from './RecordForm';
import { Download, FilePlus2, LogOut, Trash2, ArrowLeft, ActivitySquare } from 'lucide-react';
import { Badge } from './ui/badge';
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
      const q = query(collection(db, 'records'), where('userId', '==', user?.uid));
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
      <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium mb-1 cursor-pointer hover:underline" onClick={() => setIsFormOpen(false)}>
              <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nouveau Dossier Médical</h1>
          </div>
        </div>
        <RecordForm onSubmit={handleSubmit} isSubmitting={submitting} />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <ActivitySquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dossiers Patients</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez et exportez vos données médicales thyroidiennes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="ghost" onClick={logOut} className="gap-2 text-gray-500 hover:text-gray-900">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Déconnexion</span>
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2 flex-1 sm:flex-none border-gray-200">
            <Download className="h-4 w-4" /> Exporter
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 flex-1 sm:flex-none shadow-sm shadow-primary/20">
            <FilePlus2 className="h-4 w-4" /> Nouveau Dossier
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64 border rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500 font-medium">Chargement des dossiers...</p>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <FilePlus2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Aucun dossier médical</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">Vous n'avez pas encore créé de dossier. Ajoutez votre premier patient pour commencer le suivi.</p>
          <Button className="mt-8 shadow-sm shadow-primary/20" onClick={() => setIsFormOpen(true)}>
            <FilePlus2 className="w-4 h-4 mr-2"/>
            Créer le premier dossier
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="font-semibold text-gray-700">N° Dossier</TableHead>
                <TableHead className="font-semibold text-gray-700">Patient</TableHead>
                <TableHead className="font-semibold text-gray-700">Sexe</TableHead>
                <TableHead className="font-semibold text-gray-700">Histologie</TableHead>
                <TableHead className="font-semibold text-gray-700">TNM</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id} className="group hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 border-l-2 border-transparent group-hover:border-primary">
                    {r.numeroDossier || <span className="text-gray-300 italic">Non défini</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{r.nom.toUpperCase()} {r.prenoms}</span>
                      {r.ageDgc > 0 && <span className="text-xs text-gray-500">{r.ageDgc} ans au Dgc</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.sexe === 'M' ? 'default' : r.sexe === 'F' ? 'secondary' : 'outline'} className={r.sexe === 'NP' ? 'text-gray-400' : ''}>
                      {r.sexe}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{r.cdt !== 'NP' ? r.cdt : '-'}</span>
                      {r.variante !== 'NP' && <span className="text-xs text-muted-foreground">{r.variante}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded w-fit">
                      {r.t !== 'NP' || r.n !== 'NP' || r.m !== 'NP' ? `${r.t}${r.n}${r.m}` : 'NP'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
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
