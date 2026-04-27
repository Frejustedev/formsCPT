'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, useFirebase } from './FirebaseProvider';
import { MedicalRecordFormValues } from '@/lib/schemas';
import { Button, buttonVariants } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RecordForm } from './RecordForm';
import { Download, FilePlus2, LogOut, Trash2, ArrowLeft, ActivitySquare, Edit2, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Dashboard() {
  const { user, logOut } = useFirebase();
  const [records, setRecords] = useState<(MedicalRecordFormValues & { id: string })[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<(MedicalRecordFormValues & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      Promise.resolve().then(() => setLoading(true));
      const q = query(collection(db, 'records'), where('userId', '==', user?.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
      setRecords(data);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'records');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRecords();
    }
  }, [user, fetchRecords]);

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

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Registre des Dossiers Médicaux - Thyroïde", 14, 15);
    doc.setFontSize(10);
    doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

    const tableData = records.map(r => [
      r.numeroDossier || '-',
      `${r.nom.toUpperCase()} ${r.prenoms}`,
      r.sexe,
      r.ddn || '-',
      r.cdt !== 'NP' ? r.cdt : '-',
      r.variante !== 'NP' ? r.variante : '-',
      r.t !== 'NP' || r.n !== 'NP' || r.m !== 'NP' ? `${r.t}${r.n}${r.m}` : 'NP',
      r.chir !== 'NP' ? r.chir : '-',
      r.suivi ? `${r.suivi} ans` : '-'
    ]);

    autoTable(doc, {
      head: [['N° Dossier', 'Patient', 'Sexe', 'DDN', 'Histologie', 'Variante', 'TNM', 'Chirurgie', 'Suivi']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
      theme: 'grid',
    });

    doc.save("Export_Dossiers_Medicaux.pdf");
  };

  const handleExportSinglePDF = (r: MedicalRecordFormValues & { id: string }) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text("Fiche de Suivi: Cancer de la Thyroïde", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`N° Dossier: ${r.numeroDossier || 'Non défini'}`, 14, 30);
    
    autoTable(doc, {
      startY: 35,
      theme: 'plain',
      styles: { cellPadding: 2, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 100 } },
      body: [
        ['Identification', ''],
        ['Nom et Prénoms', `${r.nom.toUpperCase()} ${r.prenoms}`],
        ['Sexe / Date de Naissance', `${r.sexe} - ${r.ddn || 'NP'}`],
        ['Adresse', r.adresse || 'NP'],
        ['', ''],
        ['Antécédents & Diagnostic', ''],
        ['ATCD Familiaux CDT', r.atcdFamCdt],
        ['ATCD Familiaux Cancer', r.atcdFamCancer],
        ['ATCD Personnels Cancer', r.atcdPersCancer],
        ['Âge au diagnostic', `${r.ageDgc} ans`],
        ['', ''],
        ['Tumeur & Histologie', ''],
        ['CDT / Variante', `${r.cdt} / ${r.variante}`],
        ['TNM / Resection', `T: ${r.t}, N: ${r.n}, M: ${r.m} / R: ${r.r}`],
        ['Taille', r.sizeSup2cm === '<= 2' ? '∑ ≤ 2 cm' : r.sizeSup2cm === '> 2' ? '∑ > 2 cm' : 'NP'],
        ['Extensions / Invasions', `EC: ${r.ec} | Mac/Mic: ${r.macroMicro} | EV: ${r.ev}`],
        ['Autres Facteurs', `Mitoses: ${r.mitoses} | Hgie: ${r.hgie} | Nécrose: ${r.nse}`],
        ['Filet Nerveux', r.filetNerv],
        ['', ''],
        ['Traitement & Suivi', ''],
        ['Chirurgie / Curage', `${r.chir} / ${r.cg || 'NP'} (Tps: ${r.tps || 'NP'})`],
        ['Délai Chir - Iode 131', `${r.chirI1} mois (Dgc à I1: ${r.dgcI1} mois)`],
        ['Activité Cumulée / Cures', `${r.actCum} mCi / ${r.nbreCures} cures`],
        ['Suivi', `${r.suivi} ans`],
        ['Réponse (2a / 5a / 10a)', `${r.rep2ans} / ${r.rep5ans} / ${r.rep10ans}`],
        ['Statut', r.dcd === 'O' ? `Décédé (à ${r.dcdAge} ans)` : 'Vivant']
      ],
      didParseCell: function (data) {
        const rawRow = data.row.raw as any[];
        if (Array.isArray(rawRow) && rawRow[1] === '') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 248, 255];
          data.cell.styles.textColor = [30, 58, 138];
        }
      }
    });

    const fileName = `Fiche_Patient_${r.numeroDossier ? r.numeroDossier.replace('/', '_') : 'Inconnu'}.pdf`;
    doc.save(fileName);
  };

  const handleSubmit = async (data: MedicalRecordFormValues) => {
    try {
      setSubmitting(true);
      const payload: any = { ...data };
      delete payload.id;
      
      if (editingRecord) {
        payload.updatedAt = Date.now();
        await updateDoc(doc(db, 'records', editingRecord.id), payload);
      } else {
        const newId = crypto.randomUUID();
        payload.userId = user?.uid;
        payload.createdAt = Date.now();
        payload.updatedAt = Date.now();
        await setDoc(doc(db, 'records', newId), payload);
      }
      
      setIsFormOpen(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (e) {
      handleFirestoreError(e, editingRecord ? OperationType.UPDATE : OperationType.CREATE, 'records');
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

  const openFormForEdit = (record: MedicalRecordFormValues & { id: string }) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingRecord(null);
    setIsFormOpen(false);
  };

  if (isFormOpen) {
    return (
      <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium mb-1 cursor-pointer hover:underline" onClick={closeForm}>
              <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {editingRecord ? 'Modifier le Dossier' : 'Nouveau Dossier Médical'}
            </h1>
          </div>
        </div>
        <RecordForm initialValues={editingRecord || undefined} onSubmit={handleSubmit} onCancel={closeForm} isSubmitting={submitting} />
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
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "outline", className: "gap-2 flex-1 sm:flex-none border-gray-200 shadow-sm focus-visible:ring-1 cursor-pointer" })}>
              <Download className="h-4 w-4" /> Exporter <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                <span>Format Excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-red-500" />
                <span>Format PDF (.pdf)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">Vous n&apos;avez pas encore créé de dossier. Ajoutez votre premier patient pour commencer le suivi.</p>
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
                <TableHead className="font-semibold text-gray-700 text-right pr-6">Actions</TableHead>
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
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleExportSinglePDF(r)} className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8" title="Exporter PDF">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openFormForEdit(r)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8" title="Modifier">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-700 hover:bg-red-50 h-8 w-8" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

