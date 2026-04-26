'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { medicalRecordSchema, MedicalRecordFormValues } from '@/lib/schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileText, Activity, Stethoscope, UserIcon, CheckCircle2 } from 'lucide-react';

interface RecordFormProps {
  initialValues?: Partial<MedicalRecordFormValues>;
  onSubmit: (data: MedicalRecordFormValues) => void;
  isSubmitting?: boolean;
}

export function RecordForm({ initialValues, onSubmit, isSubmitting }: RecordFormProps) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema as any),
    defaultValues: {
      numeroDossier: '',
      nom: '',
      prenoms: '',
      sexe: 'NP',
      ddn: '',
      adresse: '',
      atcdFamCdt: 'NP',
      atcdFamCancer: 'NP',
      atcdPersCancer: 'NP',
      ageDgc: 0,
      cdt: '',
      variante: '',
      sizeSup2cm: 'NP',
      ec: 'NP',
      macroMicro: 'NP',
      ev: 'NP',
      mitoses: 'NP',
      hgie: 'NP',
      nse: 'NP',
      filetNerv: 'NP',
      r: '',
      t: '',
      n: '',
      m: '',
      chir: 'NP',
      cg: '',
      tps: '',
      dgcI1: 0,
      chirI1: 0,
      nbreCures: 0,
      actCum: 0,
      suivi: 0,
      rep2ans: 'NP',
      rep5ans: 'NP',
      rep10ans: 'NP',
      dcd: 'NP',
      dcdAge: 0,
      ...initialValues,
    },
  });

  const dcdWatcher = watch('dcd');

  const ynnpOptions = [
    { value: 'O', label: 'Oui' },
    { value: 'N', label: 'Non' },
    { value: 'NP', label: 'Non Précisé' },
  ];

  const repOptions = [
    { value: 'RC', label: 'RC' },
    { value: 'Récidive', label: 'Récidive' },
    { value: 'RP', label: 'RP' },
    { value: 'RS', label: 'RS' },
    { value: 'PD', label: 'PD' },
    { value: 'NP', label: 'Non Précisé' }
  ];

  const cdtOptions = [
    { value: 'Papillaire', label: 'Papillaire' },
    { value: 'Vésiculaire', label: 'Vésiculaire' },
    { value: 'Oncocytaire', label: 'Oncocytaire' },
    { value: 'NIFTP', label: 'NIFTP' },
    { value: 'Autre', label: 'Autre' },
    { value: 'NP', label: 'Non Précisé' },
  ];

  const varianteOptions = [
    { value: 'Classique', label: 'Classique' },
    { value: 'Folliculaire', label: 'Folliculaire' },
    { value: 'Solide', label: 'Solide' },
    { value: 'A cellules hautes', label: 'À cellules hautes' },
    { value: 'Sclérosante diffuse', label: 'Sclérosante diffuse' },
    { value: 'Autre', label: 'Autre' },
    { value: 'NP', label: 'Non Précisé' },
  ];

  const rOptions = [
    { value: 'R0', label: 'R0' },
    { value: 'R1', label: 'R1' },
    { value: 'R2', label: 'R2' },
    { value: 'Rx', label: 'Rx' },
    { value: 'NP', label: 'NP' },
  ];

  const tOptions = [
    { value: 'T1', label: 'T1' }, { value: 'T1a', label: 'T1a' }, { value: 'T1b', label: 'T1b' },
    { value: 'T2', label: 'T2' },
    { value: 'T3', label: 'T3' }, { value: 'T3a', label: 'T3a' }, { value: 'T3b', label: 'T3b' },
    { value: 'T4', label: 'T4' }, { value: 'T4a', label: 'T4a' }, { value: 'T4b', label: 'T4b' },
    { value: 'Tx', label: 'Tx' }, { value: 'NP', label: 'NP' }
  ];

  const nOptions = [
    { value: 'N0', label: 'N0' },
    { value: 'N1', label: 'N1' }, { value: 'N1a', label: 'N1a' }, { value: 'N1b', label: 'N1b' },
    { value: 'Nx', label: 'Nx' }, { value: 'NP', label: 'NP' },
  ];

  const mOptions = [
    { value: 'M0', label: 'M0' },
    { value: 'M1', label: 'M1' },
    { value: 'Mx', label: 'Mx' },
    { value: 'NP', label: 'NP' },
  ];

  const renderSelect = (name: keyof MedicalRecordFormValues, label: string, options: {value: string, label: string}[]) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div>
            <Select onValueChange={field.onChange} defaultValue={field.value as string}>
              <SelectTrigger className={errors[name] ? 'border-red-500 ring-red-500' : ''}>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[name] && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors[name]?.message as string}</p>}
          </div>
        )}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20 relative">
      <Tabs defaultValue="identification" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 mb-6 bg-gray-100/50 backdrop-blur-sm rounded-xl">
          <TabsTrigger value="identification" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 transition-all">
            <UserIcon className="w-4 h-4" /> <span className="hidden sm:inline">Identification</span>
          </TabsTrigger>
          <TabsTrigger value="antecedents" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 transition-all">
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Antécédents</span>
          </TabsTrigger>
          <TabsTrigger value="tumeur" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 transition-all">
            <Activity className="w-4 h-4" /> <span className="hidden sm:inline">Tumeur</span>
          </TabsTrigger>
          <TabsTrigger value="traitement" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 transition-all">
            <Stethoscope className="w-4 h-4" /> <span className="hidden sm:inline">Suivi</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identification" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Identification du patient</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="numeroDossier" className="text-gray-700">Numéro du dossier</Label>
                <Input id="numeroDossier" placeholder="ex: 123/24" className={errors.numeroDossier ? 'border-red-500' : 'bg-gray-50/50'} {...register('numeroDossier')} />
                {errors.numeroDossier && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.numeroDossier.message}</p>}
              </div>
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="nom" className="text-gray-700">Nom</Label>
                <Input id="nom" placeholder="Saisir le nom" className={errors.nom ? 'border-red-500' : 'bg-gray-50/50'} {...register('nom')} />
                {errors.nom && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.nom.message}</p>}
              </div>
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="prenoms" className="text-gray-700">Prénoms</Label>
                <Input id="prenoms" placeholder="Saisir les prénoms" className={errors.prenoms ? 'border-red-500' : 'bg-gray-50/50'} {...register('prenoms')} />
                {errors.prenoms && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.prenoms.message}</p>}
              </div>
              {renderSelect('sexe', 'Sexe', [
                { value: 'M', label: 'Masculin' },
                { value: 'F', label: 'Féminin' },
                { value: 'NP', label: 'Non Précisé' },
              ])}
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="ddn" className="text-gray-700">Date de Naissance</Label>
                <Input id="ddn" type="date" className="bg-gray-50/50" {...register('ddn')} />
              </div>
              <div className="space-y-1.5 flex flex-col md:col-span-2">
                <Label htmlFor="adresse" className="text-gray-700">Adresse</Label>
                <Input id="adresse" placeholder="Adresse complète" className="bg-gray-50/50" {...register('adresse')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="antecedents" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Antécédents & Diagnostic</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
              {renderSelect('atcdFamCdt', 'ATCD Fam CDT', ynnpOptions)}
              {renderSelect('atcdFamCancer', 'ATCD Fam Cancer', ynnpOptions)}
              {renderSelect('atcdPersCancer', 'ATCD Pers Cancer', ynnpOptions)}
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="ageDgc" className="text-gray-700">Age du Dgc (années)</Label>
                <Input id="ageDgc" type="number" min="0" placeholder="0" className="bg-gray-50/50" {...register('ageDgc', { valueAsNumber: true })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tumeur" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Opération & Caractéristiques Tumorales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
              <div className="col-span-1 sm:col-span-2 space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-2">Histologie</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderSelect('cdt', 'CDT', cdtOptions)}
                  {renderSelect('variante', 'Variante', varianteOptions)}
                </div>
              </div>
              
              <div className="col-span-1 lg:col-span-2 space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-2">TNM</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {renderSelect('r', 'Resection (R)', rOptions)}
                  {renderSelect('t', 'Tumor (T)', tOptions)}
                  {renderSelect('n', 'Node (N)', nOptions)}
                  {renderSelect('m', 'Metastasis (M)', mOptions)}
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-4 space-y-4 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-2">Caractéristiques Détaillées</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {renderSelect('sizeSup2cm', 'Taille de la tumeur', [
                    { value: '<= 2', label: '∑ ≤ 2 cm' },
                    { value: '> 2', label: '∑ > 2 cm' },
                    { value: 'NP', label: 'Non Précisé' },
                  ])}
                  {renderSelect('ec', 'Extension Capsulaire (EC)', ynnpOptions)}
                  {renderSelect('macroMicro', 'Invasion', [
                    { value: 'M', label: 'Macroscopique' },
                    { value: 'm', label: 'microscopique' },
                    { value: 'NP', label: 'Non Précisé' },
                  ])}
                  {renderSelect('ev', 'Emboles Vasculaires (EV)', [
                    { value: '< 4', label: '< 4' },
                    { value: '>= 4', label: '≥ 4' },
                    { value: 'NP', label: 'Non Précisé' },
                  ])}
                  {renderSelect('mitoses', 'Mitoses', [
                    { value: '< 3', label: '< 3' },
                    { value: '>= 3', label: '≥ 3' },
                    { value: 'NP', label: 'Non Précisé' },
                  ])}
                  {renderSelect('hgie', 'Hémorragie (Hgie)', ynnpOptions)}
                  {renderSelect('nse', 'Nécrose (Nse)', ynnpOptions)}
                  {renderSelect('filetNerv', 'Filet Nerveux', ynnpOptions)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traitement" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Traitement & Suivi Évolutif</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
              <div className="col-span-1 lg:col-span-3 space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Traitement Initial</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {renderSelect('chir', 'Chirurgie', [
                    { value: 'TT', label: 'Thyroïdectomie Totale (TT)' },
                    { value: 'TST', label: 'Thyroïdectomie SubTotale (TST)' },
                    { value: 'TP', label: 'Thyroïdectomie Partielle (TP)' },
                    { value: 'NP', label: 'Non Précisé' },
                  ])}
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="cg" className="text-gray-700">Curage Ganglionnaire (CG)</Label>
                    <Input id="cg" placeholder="ex: Central, Latéral" className="bg-gray-50/50" {...register('cg')} />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="tps" className="text-gray-700">Temps (tps)</Label>
                    <Input id="tps" className="bg-gray-50/50" {...register('tps')} />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="dgcI1" className="text-gray-700">Délai Dgc à Iode 131 (mois)</Label>
                    <Input id="dgcI1" type="number" min="0" className="bg-gray-50/50" {...register('dgcI1', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="chirI1" className="text-gray-700">Délai Chir à Iode 131 (mois)</Label>
                    <Input id="chirI1" type="number" min="0" className="bg-gray-50/50" {...register('chirI1', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="actCum" className="text-gray-700">Activité Cumulée (mCi)</Label>
                    <Input id="actCum" type="number" min="0" className="bg-gray-50/50" {...register('actCum', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="nbreCures" className="text-gray-700">Nbre de cures</Label>
                    <Input id="nbreCures" type="number" min="0" className="bg-gray-50/50" {...register('nbreCures', { valueAsNumber: true })} />
                  </div>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-3 space-y-4 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Suivi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="suivi" className="text-gray-700">Durée du suivi (années)</Label>
                    <Input id="suivi" type="number" min="0" className="bg-gray-50/50" {...register('suivi', { valueAsNumber: true })} />
                  </div>
                  {renderSelect('rep2ans', 'Réponse à 2 ans', repOptions)}
                  {renderSelect('rep5ans', 'Réponse à 5 ans', repOptions)}
                  {renderSelect('rep10ans', 'Réponse à 10 ans', repOptions)}
                </div>
              </div>

              <div className="col-span-1 lg:col-span-3 space-y-4 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Statut Vital</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderSelect('dcd', 'Décédé (DCD)', ynnpOptions)}
                  
                  {dcdWatcher === 'O' && (
                    <div className="space-y-1.5 flex flex-col p-4 bg-red-50/50 rounded-lg border border-red-100">
                      <Label htmlFor="dcdAge" className="text-red-800">Âge du décès</Label>
                      <Input id="dcdAge" type="number" min="0" className="bg-white border-red-200 focus-visible:ring-red-500" {...register('dcdAge', { valueAsNumber: true })} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Action Bar */}
      <div className="fixed sm:sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10 flex justify-between items-center px-4 rounded-t-2xl sm:rounded-none sm:bottom-4 sm:rounded-xl sm:border">
        <div className="hidden sm:block">
          <p className="text-sm text-gray-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Remplissage en cours...</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button type="button" variant="outline" className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 text-gray-600" onClick={() => window.history.back()}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin"/> Sauvegarde...
              </span>
            ) : 'Enregistrer le dossier'}
          </Button>
        </div>
      </div>
    </form>
  );
}
