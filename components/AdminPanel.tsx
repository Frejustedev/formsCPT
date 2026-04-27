'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData, logAction } from './DataProvider';
import { Button } from './ui/button';
import {
  ArrowLeft,
  Activity,
  Shield,
  Database,
  Search,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { LogEntry } from '@/lib/db';
import type { StoredMedicalRecord } from '@/lib/schemas';
import { RECORD_FIELD_LABELS } from '@/lib/schemas';

const LOGS_PAGE_SIZE = 200;

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const { db, platform } = useData();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [dataPath, setDataPath] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const list = await db.listLogs(LOGS_PAGE_SIZE);
      setLogs(list);
      const loc = await db.getDataLocation();
      setDataPath(loc);
    } catch (e) {
      console.error(e);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleExportGlobal = async () => {
    if (!db) return;
    setIsExporting(true);
    try {
      const data: StoredMedicalRecord[] = await db.listRecords();
      const ws = XLSX.utils.json_to_sheet(
        data.map((r) => ({
          ID: r.id,
          'Date Ajout': r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '',
          'Dernière Modif': r.updatedAt ? new Date(r.updatedAt).toLocaleString('fr-FR') : '',
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
        })),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tous_Dossiers');
      XLSX.writeFile(wb, `Export_Global_Registre_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Export global de ${data.length} dossier(s) réussi`);
      logAction(db, 'EXPORT_GLOBAL', `${data.length} dossiers exportés`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l\'export global');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackup = async () => {
    if (!db) return;
    try {
      const { filename, bytes } = await db.exportBackup();
      const blob = new Blob([bytes], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Sauvegarde téléchargée');
      logAction(db, 'BACKUP_EXPORT', filename);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleImport = async (file: File) => {
    if (!db) return;
    try {
      const bytes = await file.arrayBuffer();
      await db.importBackup(bytes);
      toast.success('Sauvegarde restaurée');
      logAction(db, 'BACKUP_IMPORT', file.name);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la restauration');
    }
  };

  const filteredLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) =>
      [l.action, l.details].some((v) => (v ?? '').toLowerCase().includes(term)),
    );
  }, [logs, logSearch]);

  return (
    <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} size="icon" className="h-10 w-10 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-500" />
              Administration
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Sauvegardes, exports et journal d&apos;activité.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportGlobal} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'Export...' : 'Export Global Excel'}
          </Button>
          <Button onClick={handleBackup} variant="outline">
            <FolderOpen className="w-4 h-4 mr-2" /> Sauvegarde JSON
          </Button>
          <label className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 rounded-md border border-input bg-background hover:bg-accent cursor-pointer">
            <Upload className="w-4 h-4 mr-2" /> Restaurer une sauvegarde
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {dataPath && (
        <div className="mb-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-sm text-blue-900 dark:text-blue-200">
          <strong>Emplacement de la base ({platform})</strong> : <code className="text-xs">{dataPath}</code>
        </div>
      )}

      <div className="bg-white dark:bg-gray-950 border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Journal d&apos;activité
          </h2>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Filtrer par action / détails..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((lg) => (
                <TableRow key={lg.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-sm">
                    {new Date(lg.timestamp).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{lg.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">{lg.details || '—'}</TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    {logs.length === 0 ? "Aucun journal d'activité" : 'Aucune entrée ne correspond au filtre.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {logs.length === LOGS_PAGE_SIZE && (
          <div className="p-3 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800">
            Affichage des {LOGS_PAGE_SIZE} journaux les plus récents.
          </div>
        )}
      </div>
    </div>
  );
}
