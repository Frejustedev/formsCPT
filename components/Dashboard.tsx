'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, useFirebase } from './FirebaseProvider';
import { MedicalRecordFormValues } from '@/lib/schemas';
import { Button, buttonVariants } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RecordForm } from './RecordForm';
import { Download, FilePlus2, LogOut, Trash2, ArrowLeft, ActivitySquare, Edit2, FileText, FileSpreadsheet, ChevronDown, Users, PieChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeToggle } from './ThemeToggle';
import { toast } from 'sonner';
import { Search, ShieldAlert } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { logAction } from './FirebaseProvider';

export function Dashboard() {
  const { user, isAdmin, logOut } = useFirebase();
  const [isAdminView, setIsAdminView] = useState(false);
  const [records, setRecords] = useState<(MedicalRecordFormValues & { id: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<(MedicalRecordFormValues & { id: string }) | null>(null);

  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      Promise.resolve().then(() => setLoading(true));
      const q = isAdmin 
        ? collection(db, 'records')
        : query(collection(db, 'records'), where('userId', '==', user?.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
      setRecords(data);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'records');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRecords();
    }
  }, [user, isAdmin, fetchRecords]);

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
        toast.success('Dossier mis à jour avec succès');
        logAction('UPDATE_RECORD', `Dossier N° ${payload.numeroDossier || editingRecord.id} mis à jour.`);
      } else {
        const newId = crypto.randomUUID();
        payload.userId = user?.uid;
        payload.createdAt = Date.now();
        payload.updatedAt = Date.now();
        await setDoc(doc(db, 'records', newId), payload);
        toast.success('Nouveau dossier créé avec succès');
        logAction('CREATE_RECORD', `Dossier N° ${payload.numeroDossier || newId} créé.`);
      }
      
      setIsFormOpen(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (e) {
      handleFirestoreError(e, editingRecord ? OperationType.UPDATE : OperationType.CREATE, 'records');
      toast.error('Erreur lors de la sauvegarde du dossier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteDoc(doc(db, 'records', recordToDelete));
      toast.success('Dossier supprimé');
      logAction('DELETE_RECORD', `Dossier supprimé (ID: ${recordToDelete})`);
      fetchRecords();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `records/${recordToDelete}`);
      toast.error('Erreur lors de la suppression');
    } finally {
      setRecordToDelete(null);
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

  const filteredRecords = records.filter(r => 
    r.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.numeroDossier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalPatients = records.length;
  const femaleCount = records.filter(r => r.sexe === 'F').length;
  const maleCount = records.filter(r => r.sexe === 'M').length;
  const validAges = records.filter(r => r.ageDgc > 0).map(r => r.ageDgc);
  const avgAge = validAges.length ? Math.round(validAges.reduce((a,b)=>a+b,0)/validAges.length) : 0;
  
  const variantsCount = records.reduce((acc, r) => {
    if (r.variante && r.variante !== 'NP') {
      acc[r.variante] = (acc[r.variante] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const sortedVariants = Object.entries(variantsCount).sort((a,b) => b[1] - a[1]);
  const totalVariantsCount = sortedVariants.reduce((sum, [_, count]) => sum + count, 0);
  const variantStatsText = sortedVariants.length > 0 
    ? sortedVariants.slice(0, 2).map(([name, count]) => `${name} (${Math.round((count / totalVariantsCount) * 100)}%)`).join(' / ')
    : 'Aucune donnée';

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    const pages = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }

    return (
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-4 bg-white dark:bg-gray-950 rounded-b-2xl">
        <span className="text-gray-500 dark:text-gray-400">
          Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} sur {filteredRecords.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {pages.map(p => (
            <Button 
              key={p} 
              variant={currentPage === p ? 'default' : 'outline'} 
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (isAdminView) {
    return <AdminPanel onClose={() => setIsAdminView(false)} />;
  }

  if (isFormOpen) {
    return (
      <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium mb-1 cursor-pointer hover:underline" onClick={closeForm}>
              <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Dossier CDT</h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Gérez et exportez vos données médicales thyroïdiennes.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          {user && (
            <div className="text-sm text-gray-600 dark:text-gray-300 hidden md:flex items-center gap-2 mr-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <span>
                Dr. <span className="font-semibold">{user.displayName || user.email?.split('@')[0]}</span>
              </span>
            </div>
          )}
          {isAdmin && (
            <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/40" onClick={() => setIsAdminView(true)}>
              <ShieldAlert className="w-4 h-4" /> Admin
            </Button>
          )}
          <ThemeToggle />
          <Button variant="ghost" onClick={logOut} className="gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-50">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Déconnexion</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "outline", className: "gap-2 flex-1 sm:flex-none border-gray-200 dark:border-gray-800 shadow-sm focus-visible:ring-1 cursor-pointer" })}>
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

      {records.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users className="w-4 h-4"/> Total Patients</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPatients}</div>
            </div>
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><PieChart className="w-4 h-4"/> Sexe (F / M)</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{femaleCount} / {maleCount}</div>
            </div>
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><ActivitySquare className="w-4 h-4"/> Variante princ.</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate" title={variantStatsText}>{variantStatsText}</div>
            </div>
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users className="w-4 h-4"/> Âge moyen Dgc</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgAge || '-'} ans</div>
            </div>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher par nom ou N° dossier..." 
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus-visible:ring-primary h-10 w-full"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 border rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Chargement des dossiers...</p>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-white dark:bg-gray-950 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
            <FilePlus2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Aucun dossier médical</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Vous n&apos;avez pas encore créé de dossier. Ajoutez votre premier patient pour commencer le suivi.</p>
          <Button className="mt-8 shadow-sm shadow-primary/20" onClick={() => setIsFormOpen(true)}>
            <FilePlus2 className="w-4 h-4 mr-2"/>
            Créer le premier dossier
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Vue Mobile (Cartes) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950 rounded-2xl border shadow-sm">
                Aucun dossier ne correspond à votre recherche.
              </div>
            ) : (
              paginatedRecords.map((r) => (
                <div key={r.id} className="flex flex-col bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{r.nom.toUpperCase()} {r.prenoms}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">N° {r.numeroDossier || 'Non défini'}</span>
                    </div>
                    <Badge variant={r.sexe === 'M' ? 'default' : r.sexe === 'F' ? 'secondary' : 'outline'} className={r.sexe === 'NP' ? 'text-gray-400 dark:text-gray-500' : ''}>
                      {r.sexe}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Âge</span>
                      <span className="font-medium dark:text-gray-200">{r.ageDgc > 0 ? `${r.ageDgc} ans` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">TNM</span>
                      <span className="font-mono dark:text-gray-200">{r.t !== 'NP' || r.n !== 'NP' || r.m !== 'NP' ? `${r.t}${r.n}${r.m}` : 'NP'}</span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Histologie</span>
                      <span className="font-medium dark:text-gray-200">{r.cdt !== 'NP' ? r.cdt : '-'}</span>
                      {r.variante !== 'NP' && <span className="text-xs text-muted-foreground ml-1">({r.variante})</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="outline" size="sm" onClick={() => handleExportSinglePDF(r)} className="text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex-1">
                      <FileText className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openFormForEdit(r)} className="text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex-1">
                      <Edit2 className="h-4 w-4 mr-2" /> Modif.
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setRecordToDelete(r.id)} className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vue Desktop (Table) */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-950 border rounded-2xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900/50 hover:bg-gray-50/80 dark:hover:bg-gray-900/50">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">N° Dossier</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Patient</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Sexe</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Histologie</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">TNM</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500 dark:text-gray-400">
                      Aucun dossier ne correspond à votre recherche.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((r) => (
                    <TableRow key={r.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100 border-l-2 border-transparent group-hover:border-primary">
                      {r.numeroDossier || <span className="text-gray-300 dark:text-gray-600 italic">Non défini</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{r.nom.toUpperCase()} {r.prenoms}</span>
                        {r.ageDgc > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{r.ageDgc} ans au Dgc</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.sexe === 'M' ? 'default' : r.sexe === 'F' ? 'secondary' : 'outline'} className={r.sexe === 'NP' ? 'text-gray-400 dark:text-gray-500' : ''}>
                        {r.sexe}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium dark:text-gray-200">{r.cdt !== 'NP' ? r.cdt : '-'}</span>
                        {r.variante !== 'NP' && <span className="text-xs text-muted-foreground">{r.variante}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit dark:text-gray-300">
                        {r.t !== 'NP' || r.n !== 'NP' || r.m !== 'NP' ? `${r.t}${r.n}${r.m}` : 'NP'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleExportSinglePDF(r)} className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 h-8 w-8" title="Exporter PDF">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openFormForEdit(r)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-8 w-8" title="Modifier">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setRecordToDelete(r.id)} className="text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 h-8 w-8" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>
          {renderPagination()}
        </div>
      )}

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible et toutes les données associées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

