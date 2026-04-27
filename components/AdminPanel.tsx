'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  orderBy,
  limit as fsLimit,
} from 'firebase/firestore';
import { db, useFirebase, logAction } from './FirebaseProvider';
import { Button } from './ui/button';
import {
  ArrowLeft,
  UserCog,
  Shield,
  Activity,
  Key,
  Database,
  Search,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
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
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { migrateStoredRecord } from '@/lib/migrate';
import type { StoredMedicalRecord } from '@/lib/schemas';
import { RECORD_FIELD_LABELS } from '@/lib/schemas';

const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'agbotonfrejuste@gmail.com').toLowerCase();
const LOGS_PAGE_SIZE = 200;

type AppUser = {
  id: string;
  email: string;
  displayName?: string;
  isUserAdmin: boolean;
};

type LogEntry = {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  details?: string;
  timestamp: number;
};

type AdminToggleState = {
  user: AppUser;
  makeAdmin: boolean;
};

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const { isAdmin } = useFirebase();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [pendingToggle, setPendingToggle] = useState<AdminToggleState | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const [uSnap, aSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'admins')),
        ]);
        const adminIds = new Set(aSnap.docs.map((d) => d.id));
        const list: AppUser[] = uSnap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const email = String(data.email ?? '');
          return {
            id: d.id,
            email,
            displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
            isUserAdmin: adminIds.has(d.id) || email.toLowerCase() === SUPER_ADMIN_EMAIL,
          };
        });
        setUsers(list);
      } else {
        const lSnap = await getDocs(query(collection(db, 'logs'), orderBy('timestamp', 'desc'), fsLimit(LOGS_PAGE_SIZE)));
        const list: LogEntry[] = lSnap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            action: String(data.action ?? ''),
            userId: String(data.userId ?? ''),
            userEmail: String(data.userEmail ?? ''),
            details: typeof data.details === 'string' ? data.details : '',
            timestamp: Number(data.timestamp ?? 0),
          };
        });
        setLogs(list);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const confirmToggleAdmin = async () => {
    if (!pendingToggle) return;
    const { user: target, makeAdmin } = pendingToggle;
    setPendingToggle(null);
    if (target.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      toast.error('Le super-administrateur ne peut pas être modifié');
      return;
    }
    try {
      if (makeAdmin) {
        await setDoc(doc(db, 'admins', target.id), {
          email: target.email,
          createdAt: Date.now(),
        });
        toast.success(`${target.email} est maintenant administrateur`);
        logAction('GRANT_ADMIN', `Droits admin accordés à ${target.email}`);
      } else {
        await deleteDoc(doc(db, 'admins', target.id));
        toast.success(`Droits admin retirés pour ${target.email}`);
        logAction('REVOKE_ADMIN', `Droits admin retirés à ${target.email}`);
      }
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la modification des droits');
    }
  };

  const handleExportGlobal = async () => {
    if (!isAdmin) return;
    setIsExporting(true);
    try {
      const snap = await getDocs(collection(db, 'records'));
      const data: StoredMedicalRecord[] = snap.docs.map((d) =>
        migrateStoredRecord(d.id, d.data() as Record<string, unknown>),
      );

      const ws = XLSX.utils.json_to_sheet(
        data.map((r) => ({
          ID: r.id,
          'Date Ajout': r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '',
          'Dernière Modif': r.updatedAt ? new Date(r.updatedAt).toLocaleString('fr-FR') : '',
          'Auteur (userId)': r.userId,
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
      logAction('EXPORT_GLOBAL', `${data.length} dossiers exportés`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l\'export global');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) =>
      [l.action, l.userEmail, l.details].some((v) => (v ?? '').toLowerCase().includes(term)),
    );
  }, [logs, logSearch]);

  if (!isAdmin) return null;

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
              Panneau d&apos;Administration
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Gérez les accès utilisateurs et exportez les données.</p>
          </div>
        </div>
        <Button
          onClick={handleExportGlobal}
          disabled={isExporting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 sm:self-center"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
          ) : (
            <Database className="w-4 h-4 mr-2" />
          )}
          {isExporting ? 'Exportation...' : 'Export Global (.xlsx)'}
        </Button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          type="button"
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          onClick={() => setActiveTab('users')}
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4" /> Utilisateurs
          </div>
        </button>
        <button
          type="button"
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          onClick={() => setActiveTab('logs')}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Journal
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white dark:bg-gray-950 border rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom / Pseudo</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSuper = u.email.toLowerCase() === SUPER_ADMIN_EMAIL;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{u.email}</TableCell>
                    <TableCell>{u.displayName || '—'}</TableCell>
                    <TableCell>
                      {isSuper ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                          Super-admin
                        </Badge>
                      ) : u.isUserAdmin ? (
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">Utilisateur</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={u.isUserAdmin ? 'outline' : 'default'}
                        size="sm"
                        className={!u.isUserAdmin ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                        onClick={() => setPendingToggle({ user: u, makeAdmin: !u.isUserAdmin })}
                        disabled={isSuper}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        {u.isUserAdmin ? 'Retirer droits' : 'Rendre Admin'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filtrer par action / email / détails..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Utilisateur</TableHead>
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
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{lg.userEmail}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{lg.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">{lg.details || '—'}</TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    {logs.length === 0 ? "Aucun journal d'activité" : 'Aucune entrée ne correspond au filtre.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {logs.length === LOGS_PAGE_SIZE && (
            <div className="p-3 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800">
              Affichage des {LOGS_PAGE_SIZE} journaux les plus récents.
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!pendingToggle} onOpenChange={(open) => !open && setPendingToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggle?.makeAdmin ? 'Accorder des droits administrateur' : 'Retirer les droits administrateur'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle?.makeAdmin
                ? `${pendingToggle?.user.email} pourra voir et modifier tous les dossiers, gérer les autres utilisateurs et accéder à l'export global. Confirmer ?`
                : `${pendingToggle?.user.email} ne pourra plus accéder qu'à ses propres dossiers. Confirmer ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAdmin}
              className={pendingToggle?.makeAdmin ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
