'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, useFirebase, logAction } from './FirebaseProvider';
import { Button } from './ui/button';
import { ArrowLeft, UserCog, Shield, Activity, Trash2, Key, Database } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const { user, isAdmin } = useFirebase();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    Promise.resolve().then(() => setLoading(true));
    try {
      if (activeTab === 'users') {
        // Fetch users
        const uSnap = await getDocs(collection(db, 'users'));
        const uData = uSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        // Also fetch admins to know who is admin
        const aSnap = await getDocs(collection(db, 'admins'));
        const aIds = new Set(aSnap.docs.map(d => d.id));
        
        setUsers(uData.map(u => ({ ...u, isUserAdmin: aIds.has(u.id) || u.email === 'agbotonfrejuste@gmail.com' })));
      } else {
        const lSnap = await getDocs(query(collection(db, 'logs'), orderBy('timestamp', 'desc')));
        setLogs(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) {
      console.error(e);
      toast.error('Erreur de chargement');
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [isAdmin, fetchData]);

  const toggleAdmin = useCallback(async (targetUserId: string, targetEmail: string, currentStatus: boolean) => {
    if (targetEmail === 'agbotonfrejuste@gmail.com') {
      toast.error('Impossible de modifier le super administrateur');
      return;
    }
    try {
      if (currentStatus) {
        await deleteDoc(doc(db, 'admins', targetUserId));
        toast.success(`Droits admin retirés pour ${targetEmail}`);
      } else {
        const timestamp = Date.now();
        await setDoc(doc(db, 'admins', targetUserId), {
          email: targetEmail,
          createdAt: timestamp
        });
        toast.success(`${targetEmail} est maintenant administrateur`);
      }
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la modification des droits');
    }
  }, [fetchData]);

  const handleExportGlobal = async () => {
    if (!isAdmin) return;
    setIsExporting(true);
    try {
      const snap = await getDocs(collection(db, 'records'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const ws = XLSX.utils.json_to_sheet(data.map((r: any) => ({
        "ID": r.id,
        "Date Ajout": new Date(r.createdAt).toLocaleDateString('fr-FR'),
        "Dernière Modif": new Date(r.updatedAt).toLocaleDateString('fr-FR'),
        "Auteur ID": r.userId,
        "N° Dossier": r.numeroDossier,
        "Nom": r.nom,
        "Prénoms": r.prenoms,
        "Sexe": r.sexe,
        "Profession": r.profession,
        "Année d'Incidence": r.anneeIncidence > 0 ? r.anneeIncidence : '',
        "Âge au Diagnostic": r.ageDgc > 0 ? r.ageDgc : '',
        "Facteurs de Risque": r.fdr,
        "Type de Découverte": r.circonstanceDecouverte,
        "Thyroïdectomie": r.chirT,
        "Curage": r.chirC,
        "Histologie (CDT)": r.cdt,
        "Variante": r.variante,
        "T": r.t,
        "N": r.n,
        "M": r.m,
        "Stade": r.stade,
        "Risque (ATA)": r.ata,
        "Besoin I-131": r.besoinI131 ? "Oui" : "Non",
        "Statut I-131": r.statutI131,
        "Nombre de Cures": r.nbreCures > 0 ? r.nbreCures : 0,
        "Activité Cumulée (mCi)": r.actCum > 0 ? r.actCum : 0,
        "Durée de Suivi (mois)": r.suivi > 0 ? r.suivi : 0,
        "Réponse 2 ans": r.rep2ans,
        "Réponse 5 ans": r.rep5ans,
        "Réponse 10 ans": r.rep10ans,
        "Statut Vital": r.dcd ? "Décédé" : "Vivant",
        "Âge au Décès": r.dcdAge > 0 ? r.dcdAge : ''
      })));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tous_Dossiers");
      XLSX.writeFile(wb, `Export_Global_Registre_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Export global de la base de données réussi');
      logAction('EXPORT_GLOBAL', `${data.length} dossiers exportés`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l\'export global');
    } finally {
      setIsExporting(false);
    }
  };

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
            <p className="text-gray-500 dark:text-gray-400">Gérez les accès utilisateurs et exportez les données d&apos;étude.</p>
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
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('users')}
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4" /> Utilisateurs
          </div>
        </button>
        <button
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Journal
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
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
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{u.email}</TableCell>
                  <TableCell>{u.displayName}</TableCell>
                  <TableCell>
                    {u.isUserAdmin ? (
                      <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">Admin</Badge>
                    ) : (
                      <Badge variant="outline">Utilisateur</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={u.isUserAdmin ? "outline" : "default"}
                      size="sm"
                      className={!u.isUserAdmin ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
                      onClick={() => toggleAdmin(u.id, u.email, u.isUserAdmin)}
                      disabled={u.email === 'agbotonfrejuste@gmail.com'}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {u.isUserAdmin ? 'Retirer droits' : 'Rendre Admin'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 border rounded-2xl shadow-sm overflow-hidden">
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
              {logs.map(lg => (
                <TableRow key={lg.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-sm">
                    {new Date(lg.timestamp).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{lg.userEmail}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{lg.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {lg.details}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">Aucun journal d&apos;activité</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
