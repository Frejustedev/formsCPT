'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData, logAction } from './DataProvider';
import {
  MedicalRecordFormValues,
  StoredMedicalRecord,
  formatTNM,
  RECORD_FIELD_LABELS,
} from '@/lib/schemas';
import { CDT_LABELS, CHIR_LABELS } from '@/lib/options';
import { Button, buttonVariants } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Download,
  FilePlus2,
  Trash2,
  Edit2,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Users,
  PieChart,
  ChevronLeft,
  ChevronRight,
  ActivitySquare,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

type SortField = 'createdAt' | 'numeroDossier' | 'nom' | 'ageDgc' | 'suivi';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const SORT_LABELS: Record<SortField, string> = {
  createdAt: 'Date d\'ajout',
  numeroDossier: 'N° de dossier',
  nom: 'Nom',
  ageDgc: 'Âge au diagnostic',
  suivi: 'Durée de suivi',
};

function exportRow(r: StoredMedicalRecord) {
  return {
    ID: r.id,
    'Date Ajout': r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '',
    'Dernière modif': r.updatedAt ? new Date(r.updatedAt).toLocaleString('fr-FR') : '',
    [RECORD_FIELD_LABELS.numeroDossier]: r.numeroDossier,
    [RECORD_FIELD_LABELS.nom]: r.nom,
    [RECORD_FIELD_LABELS.prenoms]: r.prenoms,
    [RECORD_FIELD_LABELS.sexe]: r.sexe,
    [RECORD_FIELD_LABELS.ddn]: r.ddn,
    [RECORD_FIELD_LABELS.wilaya]: r.wilaya,
    [RECORD_FIELD_LABELS.atcdFamCdt]: r.atcdFamCdt,
    [RECORD_FIELD_LABELS.atcdFamCancer]: r.atcdFamCancer,
    [RECORD_FIELD_LABELS.atcdPersCancer]: r.atcdPersCancer,
    [RECORD_FIELD_LABELS.ageDgc]: r.ageDgc || '',
    [RECORD_FIELD_LABELS.cdt]: r.cdt,
    [RECORD_FIELD_LABELS.variante]: r.variante,
    [RECORD_FIELD_LABELS.taille]: r.taille,
    [RECORD_FIELD_LABELS.ec]: r.ec,
    [RECORD_FIELD_LABELS.macroMicro]: r.macroMicro,
    [RECORD_FIELD_LABELS.ev]: r.ev,
    [RECORD_FIELD_LABELS.evCount]: r.evCount,
    [RECORD_FIELD_LABELS.mitoses]: r.mitoses,
    [RECORD_FIELD_LABELS.hgie]: r.hgie,
    [RECORD_FIELD_LABELS.nse]: r.nse,
    [RECORD_FIELD_LABELS.filetNerv]: r.filetNerv,
    [RECORD_FIELD_LABELS.r]: r.r,
    [RECORD_FIELD_LABELS.t]: r.t,
    [RECORD_FIELD_LABELS.n]: r.n,
    [RECORD_FIELD_LABELS.m]: r.m,
    [RECORD_FIELD_LABELS.chir]: r.chir,
    [RECORD_FIELD_LABELS.cg]: r.cg,
    [RECORD_FIELD_LABELS.tps]: r.tps,
    [RECORD_FIELD_LABELS.dgcI1]: r.dgcI1 || '',
    [RECORD_FIELD_LABELS.chirI1]: r.chirI1 || '',
    [RECORD_FIELD_LABELS.nbreCures]: r.nbreCures || '',
    [RECORD_FIELD_LABELS.actCum]: r.actCum || '',
    [RECORD_FIELD_LABELS.suivi]: r.suivi || '',
    [RECORD_FIELD_LABELS.rep2ans]: r.rep2ans,
    [RECORD_FIELD_LABELS.rep5ans]: r.rep5ans,
    [RECORD_FIELD_LABELS.rep10ans]: r.rep10ans,
    [RECORD_FIELD_LABELS.dcd]: r.dcd,
    [RECORD_FIELD_LABELS.dcdAge]: r.dcd === 'Oui' ? r.dcdAge || '' : '',
  };
}

function exportRecordsExcel(records: StoredMedicalRecord[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(records.map(exportRow));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dossiers');
  XLSX.writeFile(wb, filename);
}

function exportRecordsPDF(records: StoredMedicalRecord[], filename: string) {
  const pdf = new jsPDF('landscape');
  pdf.setFontSize(16);
  pdf.text('Registre Cancer Thyroïde — Liste des dossiers', 14, 15);
  pdf.setFontSize(10);
  pdf.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR')}  •  ${records.length} dossier(s)`, 14, 22);

  const body = records.map((r) => [
    r.numeroDossier || '—',
    `${(r.nom || '').toUpperCase()} ${r.prenoms || ''}`.trim(),
    r.sexe || '—',
    r.wilaya || '—',
    r.cdt || '—',
    r.variante || '—',
    formatTNM(r),
    r.chir || '—',
    r.suivi ? `${r.suivi} ans` : '—',
    r.dcd || '—',
  ]);

  autoTable(pdf, {
    head: [['N° Dossier', 'Patient', 'Sexe', 'Wilaya', 'CDT', 'Variante', 'TNM', 'Chir', 'Suivi', 'DCD']],
    body,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    theme: 'grid',
  });

  pdf.save(filename);
}

function exportSinglePDF(r: StoredMedicalRecord) {
  const pdf = new jsPDF();
  pdf.setFontSize(18);
  pdf.setTextColor(30, 58, 138);
  pdf.text('Fiche de Suivi — Cancer Différencié de la Thyroïde', 14, 20);

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`N° Dossier : ${r.numeroDossier || 'Non défini'}`, 14, 30);

  const dash = '—';
  const cdtLabel = r.cdt ? CDT_LABELS[r.cdt as keyof typeof CDT_LABELS] ?? r.cdt : dash;
  const chirLabel = r.chir ? CHIR_LABELS[r.chir as keyof typeof CHIR_LABELS] ?? r.chir : dash;

  autoTable(pdf, {
    startY: 35,
    theme: 'plain',
    styles: { cellPadding: 2, fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 110 } },
    body: [
      ['Identification', ''],
      ['Nom et Prénoms', `${(r.nom || '').toUpperCase()} ${r.prenoms || ''}`.trim() || dash],
      ['Sexe / Date de Naissance', `${r.sexe || dash} — ${r.ddn || dash}`],
      ['Wilaya', r.wilaya || dash],
      ['', ''],
      ['Antécédents & Diagnostic', ''],
      ['ATCD Familiaux CDT', r.atcdFamCdt || dash],
      ['ATCD Familiaux Cancer', r.atcdFamCancer || dash],
      ['ATCD Personnels Cancer', r.atcdPersCancer || dash],
      ['Âge au diagnostic', r.ageDgc ? `${r.ageDgc} ans` : dash],
      ['', ''],
      ['Tumeur & Histologie', ''],
      ['CDT', cdtLabel],
      ['Variante', r.variante || dash],
      ['TNM / Resection', `T : ${r.t || dash}, N : ${r.n || dash}, M : ${r.m || dash} / R : ${r.r || dash}`],
      ['Taille (∑)', r.taille || dash],
      ['EC / Macro-micro', `${r.ec || dash} / ${r.macroMicro || dash}`],
      ['EV / Taille EV', `${r.ev || dash} / ${r.evCount || dash}`],
      ['Mitoses / Hgie / Nse', `${r.mitoses || dash} / ${r.hgie || dash} / ${r.nse || dash}`],
      ['Filet Nerveux', r.filetNerv || dash],
      ['', ''],
      ['Traitement & Suivi', ''],
      ['Chirurgie', chirLabel],
      ['Curage Ganglionnaire (CG)', r.cg || dash],
      ['Temps (tps)', r.tps || dash],
      ['Délai Chir → I1 (mois)', r.chirI1 ? `${r.chirI1}` : dash],
      ['Délai Dgc → I1 (mois)', r.dgcI1 ? `${r.dgcI1}` : dash],
      ['Activité cumulée / Cures', `${r.actCum || dash} mCi / ${r.nbreCures || dash} cure(s)`],
      ['Suivi (années)', r.suivi ? `${r.suivi}` : dash],
      ['Réponse 2 / 5 / 10 ans', `${r.rep2ans || dash} / ${r.rep5ans || dash} / ${r.rep10ans || dash}`],
      ['Statut', r.dcd === 'Oui' ? `Décédé (${r.dcdAge || '?'} ans)` : (r.dcd || dash)],
    ],
    didParseCell: (data) => {
      const rawRow = data.row.raw as unknown[];
      if (Array.isArray(rawRow) && rawRow[1] === '') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 248, 255];
        data.cell.styles.textColor = [30, 58, 138];
      }
    },
  });

  const fileName = `Fiche_Patient_${r.numeroDossier ? r.numeroDossier.replace('/', '_') : 'Inconnu'}.pdf`;
  pdf.save(fileName);
}

export function Dashboard() {
  const { db } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<StoredMedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordToDelete, setRecordToDelete] = useState<StoredMedicalRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const searchTerm = searchParams.get('q') ?? '';
  const filterSexe = searchParams.get('sexe') ?? 'Tous';
  const filterAge = searchParams.get('age') ?? 'Tous';
  const filterCdt = searchParams.get('cdt') ?? 'Tous';
  const filterDcd = searchParams.get('dcd') ?? 'Tous';
  const sortField = (searchParams.get('sort') as SortField) || 'createdAt';
  const sortDir = (searchParams.get('dir') as SortDir) || 'desc';

  const updateParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === 'Tous') next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
      setCurrentPage(1);
    },
    [router, searchParams],
  );

  const refresh = useCallback(async () => {
    if (!db) return;
    try {
      const list = await db.listRecords();
      setRecords(list);
    } catch (e) {
      console.error('Failed to load records', e);
      toast.error('Impossible de charger les dossiers');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (!db) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const off = db.onRecordsChanged(() => {
      refresh();
    });
    return off;
  }, [db, refresh]);

  const handleDelete = async () => {
    if (!recordToDelete || !db) return;
    try {
      await db.deleteRecord(recordToDelete.id);
      toast.success('Dossier supprimé');
      logAction(db, 'DELETE_RECORD', `Dossier N° ${recordToDelete.numeroDossier || recordToDelete.id} supprimé.`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression');
    } finally {
      setRecordToDelete(null);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return records
      .filter((r) => {
        if (term) {
          const haystack = `${r.nom} ${r.prenoms} ${r.numeroDossier}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        if (filterSexe !== 'Tous' && r.sexe !== filterSexe) return false;
        if (filterCdt !== 'Tous' && r.cdt !== filterCdt) return false;
        if (filterDcd !== 'Tous' && r.dcd !== filterDcd) return false;
        if (filterAge === '< 40 ans' && !(r.ageDgc > 0 && r.ageDgc < 40)) return false;
        if (filterAge === '≥ 40 ans' && !(r.ageDgc >= 40)) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        const av = a[sortField];
        const bv = b[sortField];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av ?? '').localeCompare(String(bv ?? ''), 'fr', { numeric: true }) * dir;
      });
  }, [records, searchTerm, filterSexe, filterAge, filterCdt, filterDcd, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const stats = useMemo(() => {
    const total = records.length;
    const female = records.filter((r) => r.sexe === 'Féminin').length;
    const male = records.filter((r) => r.sexe === 'Masculin').length;
    const validAges = records.filter((r) => r.ageDgc > 0).map((r) => r.ageDgc);
    const avgAge = validAges.length ? Math.round(validAges.reduce((a, b) => a + b, 0) / validAges.length) : 0;
    const variantCounts = records.reduce<Record<string, number>>((acc, r) => {
      if (r.variante) acc[r.variante] = (acc[r.variante] || 0) + 1;
      return acc;
    }, {});
    const aliveCount = records.filter((r) => r.dcd === 'Non').length;
    const dcdCount = records.filter((r) => r.dcd === 'Oui').length;
    return { total, female, male, avgAge, variantCounts, aliveCount, dcdCount };
  }, [records]);

  const variantStatsText = useMemo(() => {
    const entries = Object.entries(stats.variantCounts).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return 'Aucune donnée';
    const totalVariants = entries.reduce((sum, [, c]) => sum + c, 0);
    return entries
      .slice(0, 2)
      .map(([n, c]) => `${n} (${Math.round((c / totalVariants) * 100)}%)`)
      .join(' / ');
  }, [stats.variantCounts]);

  const handleExportXlsx = () => {
    exportRecordsExcel(filteredRecords, `Dossiers_CDT_${new Date().toISOString().split('T')[0]}.xlsx`);
    logAction(db, 'EXPORT_XLSX', `${filteredRecords.length} dossier(s) exportés (Excel).`);
  };

  const handleExportPDF = () => {
    exportRecordsPDF(filteredRecords, `Dossiers_CDT_${new Date().toISOString().split('T')[0]}.pdf`);
    logAction(db, 'EXPORT_PDF', `${filteredRecords.length} dossier(s) exportés (PDF).`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return (
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-4 bg-white dark:bg-gray-950 rounded-b-2xl">
        <span className="text-gray-500 dark:text-gray-400">
          Affichage {(safePage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(safePage * ITEMS_PER_PAGE, filteredRecords.length)} sur {filteredRecords.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {pages.map((p) => (
            <Button key={p} variant={safePage === p ? 'default' : 'outline'} className="h-8 w-8 p-0" onClick={() => setCurrentPage(p)}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderVariantBars = () => {
    const entries = Object.entries(stats.variantCounts).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return null;
    const max = entries[0][1];
    return (
      <div className="space-y-2">
        {entries.map(([name, count]) => (
          <div key={name} className="flex items-center gap-3 text-xs">
            <span className="w-32 truncate text-gray-600 dark:text-gray-400">{name}</span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded h-2">
              <div className="bg-blue-500 h-2 rounded" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="tabular-nums w-8 text-right text-gray-700 dark:text-gray-300">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <ActivitySquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Registre des cancers différenciés de la thyroïde.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: 'outline', className: 'gap-2 flex-1 sm:flex-none border-gray-200 dark:border-gray-800 shadow-sm focus-visible:ring-1 cursor-pointer' })}>
              <ArrowUpDown className="h-4 w-4" /> {SORT_LABELS[sortField]} {sortDir === 'asc' ? '↑' : '↓'}
              <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                <DropdownMenuItem
                  key={field}
                  className="cursor-pointer"
                  onClick={() => updateParam({ sort: field, dir: sortField === field && sortDir === 'desc' ? 'asc' : 'desc' })}
                >
                  {SORT_LABELS[field]}
                  {sortField === field && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: 'outline', className: 'gap-2 flex-1 sm:flex-none border-gray-200 dark:border-gray-800 shadow-sm focus-visible:ring-1 cursor-pointer' })}>
              <Download className="h-4 w-4" /> Exporter <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportXlsx} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                <span>Format Excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-red-500" />
                <span>Format PDF (.pdf)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push('/records/new')} className="gap-2 flex-1 sm:flex-none shadow-sm shadow-primary/20">
            <FilePlus2 className="h-4 w-4" /> Nouveau Dossier
          </Button>
        </div>
      </header>

      {records.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users className="w-4 h-4" /> Total Patients</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            </div>
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><PieChart className="w-4 h-4" /> Sexe (F / M)</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.female} / {stats.male}</div>
            </div>
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><ActivitySquare className="w-4 h-4" /> Variantes principales</div>
              <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate" title={variantStatsText}>{variantStatsText}</div>
            </div>
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users className="w-4 h-4" /> Âge moyen au Dgc</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgAge || '—'} ans</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Distribution par variante</h3>
              {renderVariantBars() ?? <p className="text-xs text-gray-500">Aucune donnée disponible.</p>}
            </div>
            <div className="bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Statut vital</h3>
              <div className="flex items-center justify-between text-sm">
                <span>Vivants</span>
                <span className="font-semibold tabular-nums">{stats.aliveCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Décédés</span>
                <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">{stats.dcdCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Inconnu / Perdu de vue</span>
                <span className="font-semibold tabular-nums text-gray-500">{stats.total - stats.aliveCount - stats.dcdCount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, prénom ou N° dossier..."
                value={searchTerm}
                onChange={(e) => updateParam({ q: e.target.value })}
                className="pl-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus-visible:ring-primary h-10 w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1">Filtres :</span>

              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                {['Tous', 'Masculin', 'Féminin'].map((s) => (
                  <button key={s} type="button" onClick={() => updateParam({ sexe: s })} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterSexe === s ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    {s === 'Tous' ? 'Tous' : s}
                  </button>
                ))}
              </div>

              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                {['Tous', '< 40 ans', '≥ 40 ans'].map((a) => (
                  <button key={a} type="button" onClick={() => updateParam({ age: a })} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterAge === a ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    {a === 'Tous' ? 'Tout âge' : a}
                  </button>
                ))}
              </div>

              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                {['Tous', 'CPT', 'CVT', 'COT'].map((c) => (
                  <button key={c} type="button" onClick={() => updateParam({ cdt: c })} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterCdt === c ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    {c === 'Tous' ? 'Toutes histo.' : c}
                  </button>
                ))}
              </div>

              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                {['Tous', 'Non', 'Oui', 'Perdu de vue'].map((d) => (
                  <button key={d} type="button" onClick={() => updateParam({ dcd: d })} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterDcd === d ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    {d === 'Tous' ? 'Tous DCD' : d === 'Non' ? 'Vivants' : d === 'Oui' ? 'Décédés' : 'Perdu de vue'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 border rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Chargement des dossiers...</p>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-white dark:bg-gray-950 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
            <FilePlus2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Aucun dossier médical</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Aucun dossier n&apos;a encore été créé. Ajoutez votre premier patient pour commencer le suivi.
          </p>
          <Button className="mt-8 shadow-sm shadow-primary/20" onClick={() => router.push('/records/new')}>
            <FilePlus2 className="w-4 h-4 mr-2" /> Créer le premier dossier
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
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
                      <span className="text-sm text-gray-500 dark:text-gray-400">N° {r.numeroDossier || '—'}</span>
                    </div>
                    <Badge variant={r.sexe === 'Masculin' ? 'default' : r.sexe === 'Féminin' ? 'secondary' : 'outline'} className={!r.sexe ? 'text-gray-400 dark:text-gray-500' : ''}>
                      {r.sexe || '—'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Âge</span>
                      <span className="font-medium dark:text-gray-200">{r.ageDgc > 0 ? `${r.ageDgc} ans` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">TNM</span>
                      <span className="font-mono dark:text-gray-200">{formatTNM(r)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Histologie</span>
                      <span className="font-medium dark:text-gray-200">{r.cdt || '—'}</span>
                      {r.variante && <span className="text-xs text-muted-foreground ml-1">({r.variante})</span>}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Wilaya</span>
                      <span className="font-medium dark:text-gray-200">{r.wilaya || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Statut</span>
                      <span className={`font-medium ${r.dcd === 'Oui' ? 'text-red-600' : ''}`}>{r.dcd || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="outline" size="sm" onClick={() => exportSinglePDF(r)} className="text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex-1">
                      <FileText className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/records/edit?id=${r.id}`)} className="text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex-1">
                      <Edit2 className="h-4 w-4 mr-2" /> Modif.
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setRecordToDelete(r)} className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-950 border rounded-2xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900/50 hover:bg-gray-50/80 dark:hover:bg-gray-900/50">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">N° Dossier</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Patient</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Sexe</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Wilaya</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">CDT / Variante</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">TNM</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Statut</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-500 dark:text-gray-400">
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
                        <Badge variant={r.sexe === 'Masculin' ? 'default' : r.sexe === 'Féminin' ? 'secondary' : 'outline'} className={!r.sexe ? 'text-gray-400 dark:text-gray-500' : ''}>
                          {r.sexe || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 dark:text-gray-300">{r.wilaya || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium dark:text-gray-200">{r.cdt || '—'}</span>
                          {r.variante && <span className="text-xs text-muted-foreground">{r.variante}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit dark:text-gray-300">
                          {formatTNM(r)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${r.dcd === 'Oui' ? 'text-red-600' : r.dcd === 'Non' ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>
                          {r.dcd === 'Oui' ? `Décédé${r.dcdAge ? ` (${r.dcdAge} ans)` : ''}` : r.dcd || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => exportSinglePDF(r)} className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 h-8 w-8" title="Exporter PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/records/edit?id=${r.id}`)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-8 w-8" title="Modifier">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setRecordToDelete(r)} className="text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 h-8 w-8" title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {renderPagination()}
        </div>
      )}

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier {recordToDelete?.numeroDossier}</AlertDialogTitle>
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
