'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  medicalRecordSchema,
  MedicalRecordFormValues,
  RECORD_DEFAULTS,
  RECORD_FIELD_LABELS,
} from '@/lib/schemas';
import {
  SEXE_OPTIONS,
  YNNP_OPTIONS,
  CDT_OPTIONS,
  CDT_LABELS,
  VARIANTE_OPTIONS,
  TAILLE_OPTIONS,
  MACRO_MICRO_OPTIONS,
  EV_COUNT_OPTIONS,
  MITOSES_OPTIONS,
  R_OPTIONS,
  T_OPTIONS,
  N_OPTIONS,
  M_OPTIONS,
  CHIR_OPTIONS,
  CHIR_LABELS,
  TPS_OPTIONS,
  REPONSE_OPTIONS,
  REPONSE_LABELS,
  DCD_OPTIONS,
} from '@/lib/options';
import { WILAYAS } from '@/lib/wilayas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  FileText,
  Activity,
  Stethoscope,
  UserIcon,
  CheckCircle2,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useData } from './DataProvider';
import { toast } from 'sonner';

interface RecordFormProps {
  initialValues?: Partial<MedicalRecordFormValues>;
  onSubmit: (data: MedicalRecordFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

type TabId = 'identification' | 'antecedents' | 'tumeur' | 'traitement';

const TAB_FIELDS: Record<TabId, (keyof MedicalRecordFormValues)[]> = {
  identification: ['numeroDossier', 'nom', 'prenoms', 'sexe', 'ddn', 'wilaya'],
  antecedents: ['atcdFamCdt', 'atcdFamCancer', 'atcdPersCancer', 'ageDgc'],
  tumeur: [
    'cdt', 'variante', 'taille', 'ec', 'macroMicro', 'ev', 'evCount',
    'mitoses', 'hgie', 'nse', 'filetNerv', 'r', 't', 'n', 'm',
  ],
  traitement: [
    'chir', 'cg', 'tps', 'dgcI1', 'chirI1', 'nbreCures', 'actCum', 'suivi',
    'rep2ans', 'rep5ans', 'rep10ans', 'dcd', 'dcdAge',
  ],
};

const TAB_ORDER: TabId[] = ['identification', 'antecedents', 'tumeur', 'traitement'];

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value > 0;
  return Boolean(value);
}

function tabProgress(values: MedicalRecordFormValues, tab: TabId): { filled: number; total: number } {
  const fields = TAB_FIELDS[tab];
  const filled = fields.filter((f) => isFilled(values[f])).length;
  return { filled, total: fields.length };
}

function makeOptions<T extends readonly string[]>(values: T, labels?: Partial<Record<T[number], string>>) {
  return values.map((v) => ({ value: v, label: labels?.[v as T[number]] ?? v }));
}

export function RecordForm({ initialValues, onSubmit, onCancel, isSubmitting }: RecordFormProps) {
  const { db } = useData();
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('identification');
  const [draftLoaded, setDraftLoaded] = useState(false);

  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: { ...RECORD_DEFAULTS, ...(initialValues ?? {}) },
    mode: 'onBlur',
  });
  const { register, control, handleSubmit, watch, reset, formState: { errors } } = form;

  useEffect(() => {
    let cancelled = false;
    async function loadDraft() {
      if (initialValues || !db) {
        setDraftLoaded(true);
        return;
      }
      try {
        const draft = await db.getDraft();
        if (cancelled) return;
        if (draft) {
          reset({ ...RECORD_DEFAULTS, ...draft.data });
          setDraftSavedAt(new Date(draft.updatedAt));
        }
      } catch (e) {
        console.error('Failed to load draft', e);
      } finally {
        if (!cancelled) setDraftLoaded(true);
      }
    }
    loadDraft();
    return () => {
      cancelled = true;
    };
  }, [initialValues, db, reset]);

  useEffect(() => {
    if (initialValues || !db || !draftLoaded) return;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const subscription = watch((value) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await db.saveDraft(value as MedicalRecordFormValues);
          setDraftSavedAt(new Date());
        } catch (e) {
          console.error('Failed to save draft', e);
        }
      }, 1500);
    });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [watch, initialValues, db, draftLoaded]);

  const dcdValue = useWatch({ control, name: 'dcd' });
  useEffect(() => {
    if (dcdValue !== 'Oui') {
      const current = form.getValues('dcdAge');
      if (current) form.setValue('dcdAge', 0, { shouldDirty: true });
    }
  }, [dcdValue, form]);

  const evValue = useWatch({ control, name: 'ev' });
  useEffect(() => {
    if (evValue !== 'Oui') {
      const current = form.getValues('evCount');
      if (current) form.setValue('evCount', '', { shouldDirty: true });
    }
  }, [evValue, form]);

  const clearDraft = useCallback(async () => {
    if (!db || initialValues) return;
    try {
      await db.clearDraft();
      reset(RECORD_DEFAULTS);
      setDraftSavedAt(null);
      toast.success('Brouillon effacé');
    } catch (e) {
      console.error('Failed to clear draft', e);
      toast.error('Erreur lors de la suppression du brouillon');
    }
  }, [db, initialValues, reset]);

  const onSubmitCallback = (data: MedicalRecordFormValues) => {
    onSubmit(data);
    if (!initialValues && db) {
      db.clearDraft().catch((e) => console.error('Failed to delete draft on submit', e));
    }
  };

  const renderSelect = <K extends keyof MedicalRecordFormValues>(
    name: K,
    label: string,
    options: { value: string; label: string }[],
    extra?: { disabled?: boolean; help?: string },
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={name as string}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div>
            <Select
              onValueChange={field.onChange}
              value={(field.value as string) || ''}
              disabled={extra?.disabled}
            >
              <SelectTrigger className={errors[name] ? 'border-red-500 ring-red-500' : ''}>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {extra?.help && <p className="text-xs text-muted-foreground mt-1">{extra.help}</p>}
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors[name]?.message as string}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );

  const renderNumber = <K extends keyof MedicalRecordFormValues>(
    name: K,
    label: string,
    extra?: { disabled?: boolean; max?: number; help?: string },
  ) => (
    <div className="space-y-1.5 flex flex-col">
      <Label htmlFor={name as string}>{label}</Label>
      <Input
        id={name as string}
        type="number"
        min={0}
        max={extra?.max}
        disabled={extra?.disabled}
        className="bg-muted/50"
        {...register(name, {
          setValueAs: (v) => {
            if (v === '' || v === null || v === undefined) return 0;
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
          },
        })}
      />
      {extra?.help && <p className="text-xs text-muted-foreground mt-1">{extra.help}</p>}
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[name]?.message as string}
        </p>
      )}
    </div>
  );

  const watchedValues = watch();
  const progressByTab: Record<TabId, { filled: number; total: number }> = {
    identification: tabProgress(watchedValues, 'identification'),
    antecedents: tabProgress(watchedValues, 'antecedents'),
    tumeur: tabProgress(watchedValues, 'tumeur'),
    traitement: tabProgress(watchedValues, 'traitement'),
  };

  const currentTabIndex = TAB_ORDER.indexOf(activeTab);
  const goPrev = () => currentTabIndex > 0 && setActiveTab(TAB_ORDER[currentTabIndex - 1]);
  const goNext = () => currentTabIndex < TAB_ORDER.length - 1 && setActiveTab(TAB_ORDER[currentTabIndex + 1]);

  if (!draftLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4" />
        <p>Chargement du formulaire...</p>
      </div>
    );
  }

  const sexeOpts = makeOptions(SEXE_OPTIONS);
  const ynnpOpts = makeOptions(YNNP_OPTIONS);
  const cdtOpts = makeOptions(CDT_OPTIONS, CDT_LABELS);
  const varianteOpts = makeOptions(VARIANTE_OPTIONS);
  const tailleOpts = makeOptions(TAILLE_OPTIONS);
  const macroOpts = makeOptions(MACRO_MICRO_OPTIONS);
  const evCountOpts = makeOptions(EV_COUNT_OPTIONS);
  const mitosesOpts = makeOptions(MITOSES_OPTIONS);
  const rOpts = makeOptions(R_OPTIONS);
  const tOpts = makeOptions(T_OPTIONS);
  const nOpts = makeOptions(N_OPTIONS);
  const mOpts = makeOptions(M_OPTIONS);
  const chirOpts = makeOptions(CHIR_OPTIONS, CHIR_LABELS);
  const tpsOpts = makeOptions(TPS_OPTIONS);
  const reponseOpts = makeOptions(REPONSE_OPTIONS, REPONSE_LABELS);
  const dcdOpts = makeOptions(DCD_OPTIONS);
  const wilayaOpts = WILAYAS.map((w) => ({ value: w, label: w }));

  const renderTabBadge = (tab: TabId) => {
    const { filled, total } = progressByTab[tab];
    const complete = filled === total;
    return (
      <Badge
        variant="secondary"
        className={`text-[10px] tabular-nums ml-1 ${complete ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : ''}`}
      >
        {filled}/{total}
      </Badge>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmitCallback)} className="space-y-6 pb-32 relative">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
        <TabsList className="flex overflow-x-auto w-full hide-scrollbar h-auto p-1 mb-6 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl justify-start md:grid md:grid-cols-4">
          <TabsTrigger value="identification" className="flex-1 min-w-[160px] py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm rounded-lg flex items-center justify-center gap-2 transition-all">
            <UserIcon className="w-4 h-4" /> <span>Identification</span>
            {renderTabBadge('identification')}
          </TabsTrigger>
          <TabsTrigger value="antecedents" className="flex-1 min-w-[160px] py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm rounded-lg flex items-center justify-center gap-2 transition-all">
            <FileText className="w-4 h-4" /> <span>Antécédents</span>
            {renderTabBadge('antecedents')}
          </TabsTrigger>
          <TabsTrigger value="tumeur" className="flex-1 min-w-[160px] py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm rounded-lg flex items-center justify-center gap-2 transition-all">
            <Activity className="w-4 h-4" /> <span>Tumeur</span>
            {renderTabBadge('tumeur')}
          </TabsTrigger>
          <TabsTrigger value="traitement" className="flex-1 min-w-[160px] py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm rounded-lg flex items-center justify-center gap-2 transition-all">
            <Stethoscope className="w-4 h-4" /> <span>Suivi</span>
            {renderTabBadge('traitement')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identification" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Identification du patient</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="numeroDossier">{RECORD_FIELD_LABELS.numeroDossier}</Label>
                <Controller
                  name="numeroDossier"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="numeroDossier"
                      placeholder="ex : 123/24"
                      className={errors.numeroDossier ? 'border-red-500' : 'bg-muted/50'}
                      {...field}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        if (val.length > 3) val = val.substring(0, 3) + '/' + val.substring(3, 5).replace(/[^0-9]/g, '');
                        field.onChange(val);
                      }}
                      maxLength={6}
                    />
                  )}
                />
                {errors.numeroDossier && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.numeroDossier.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="nom">{RECORD_FIELD_LABELS.nom}</Label>
                <Input id="nom" placeholder="Saisir le nom" className={errors.nom ? 'border-red-500' : 'bg-muted/50'} {...register('nom')} />
                {errors.nom && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.nom.message}</p>}
              </div>
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="prenoms">{RECORD_FIELD_LABELS.prenoms}</Label>
                <Input id="prenoms" placeholder="Saisir les prénoms" className={errors.prenoms ? 'border-red-500' : 'bg-muted/50'} {...register('prenoms')} />
                {errors.prenoms && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.prenoms.message}</p>}
              </div>
              {renderSelect('sexe', RECORD_FIELD_LABELS.sexe, sexeOpts)}
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="ddn">{RECORD_FIELD_LABELS.ddn}</Label>
                <Input id="ddn" type="date" className="bg-muted/50" {...register('ddn')} />
              </div>
              {renderSelect('wilaya', RECORD_FIELD_LABELS.wilaya, wilayaOpts)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="antecedents" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Antécédents & Diagnostic</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
              {renderSelect('atcdFamCdt', RECORD_FIELD_LABELS.atcdFamCdt, ynnpOpts)}
              {renderSelect('atcdFamCancer', RECORD_FIELD_LABELS.atcdFamCancer, ynnpOpts)}
              {renderSelect('atcdPersCancer', RECORD_FIELD_LABELS.atcdPersCancer, ynnpOpts)}
              {renderNumber('ageDgc', RECORD_FIELD_LABELS.ageDgc, { max: 120 })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tumeur" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Caractéristiques tumorales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
              <div className="col-span-1 sm:col-span-2 space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-2">Histologie</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderSelect('cdt', RECORD_FIELD_LABELS.cdt, cdtOpts)}
                  {renderSelect('variante', RECORD_FIELD_LABELS.variante, varianteOpts)}
                </div>
              </div>

              <div className="col-span-1 lg:col-span-2 space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-2">TNM</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {renderSelect('r', RECORD_FIELD_LABELS.r, rOpts)}
                  {renderSelect('t', RECORD_FIELD_LABELS.t, tOpts)}
                  {renderSelect('n', RECORD_FIELD_LABELS.n, nOpts)}
                  {renderSelect('m', RECORD_FIELD_LABELS.m, mOpts)}
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-4 space-y-4 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-2">Caractéristiques détaillées</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {renderSelect('taille', RECORD_FIELD_LABELS.taille, tailleOpts)}
                  {renderSelect('ec', RECORD_FIELD_LABELS.ec, ynnpOpts)}
                  {renderSelect('macroMicro', RECORD_FIELD_LABELS.macroMicro, macroOpts)}
                  {renderSelect('ev', RECORD_FIELD_LABELS.ev, ynnpOpts)}
                  {renderSelect('evCount', RECORD_FIELD_LABELS.evCount, evCountOpts, {
                    disabled: evValue !== 'Oui',
                    help: evValue === 'Oui' ? undefined : 'Disponible si EV = Oui',
                  })}
                  {renderSelect('mitoses', RECORD_FIELD_LABELS.mitoses, mitosesOpts)}
                  {renderSelect('hgie', RECORD_FIELD_LABELS.hgie, ynnpOpts)}
                  {renderSelect('nse', RECORD_FIELD_LABELS.nse, ynnpOpts)}
                  {renderSelect('filetNerv', RECORD_FIELD_LABELS.filetNerv, ynnpOpts)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traitement" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Traitement & suivi évolutif</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
              <div className="col-span-1 lg:col-span-3 space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Traitement initial</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {renderSelect('chir', RECORD_FIELD_LABELS.chir, chirOpts)}
                  {renderSelect('cg', RECORD_FIELD_LABELS.cg, ynnpOpts)}
                  {renderSelect('tps', RECORD_FIELD_LABELS.tps, tpsOpts)}
                  {renderNumber('dgcI1', RECORD_FIELD_LABELS.dgcI1, { max: 600 })}
                  {renderNumber('chirI1', RECORD_FIELD_LABELS.chirI1, { max: 600 })}
                  {renderNumber('actCum', RECORD_FIELD_LABELS.actCum, { max: 5000 })}
                  {renderNumber('nbreCures', RECORD_FIELD_LABELS.nbreCures, { max: 50 })}
                </div>
              </div>

              <div className="col-span-1 lg:col-span-3 space-y-4 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Suivi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderNumber('suivi', RECORD_FIELD_LABELS.suivi, { max: 80 })}
                  {renderSelect('rep2ans', RECORD_FIELD_LABELS.rep2ans, reponseOpts)}
                  {renderSelect('rep5ans', RECORD_FIELD_LABELS.rep5ans, reponseOpts)}
                  {renderSelect('rep10ans', RECORD_FIELD_LABELS.rep10ans, reponseOpts)}
                </div>
              </div>

              <div className="col-span-1 lg:col-span-3 space-y-4 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Statut vital</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderSelect('dcd', RECORD_FIELD_LABELS.dcd, dcdOpts)}
                  {dcdValue === 'Oui' && (
                    <div className="space-y-1.5 flex flex-col p-4 bg-red-50/50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900">
                      <Label htmlFor="dcdAge" className="text-red-800 dark:text-red-300">{RECORD_FIELD_LABELS.dcdAge}</Label>
                      <Input
                        id="dcdAge"
                        type="number"
                        min={0}
                        max={120}
                        className="bg-white dark:bg-gray-900 border-red-200 dark:border-red-900 focus-visible:ring-red-500"
                        {...register('dcdAge', {
                          setValueAs: (v) => {
                            if (v === '' || v === null || v === undefined) return 0;
                            const n = Number(v);
                            return Number.isFinite(n) ? n : 0;
                          },
                        })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between gap-3">
        <Button type="button" variant="ghost" onClick={goPrev} disabled={currentTabIndex === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
        </Button>
        <Button type="button" variant="ghost" onClick={goNext} disabled={currentTabIndex === TAB_ORDER.length - 1}>
          Suivant <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="fixed sm:sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10 flex flex-wrap justify-between items-center gap-3 px-4 rounded-t-2xl sm:rounded-none sm:bottom-4 sm:rounded-xl sm:border">
        <div className="hidden sm:flex flex-1 items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> Remplissage en cours...
          {draftSavedAt && (
            <span className="flex items-center gap-1 text-blue-500">
              <Save className="w-3 h-3" /> Brouillon enregistré à {draftSavedAt.toLocaleTimeString('fr-FR')}
            </span>
          )}
          {!initialValues && draftSavedAt && (
            <Button type="button" variant="ghost" size="sm" onClick={clearDraft} className="text-red-500 hover:text-red-700 ml-2">
              <Trash2 className="w-3 h-3 mr-1" /> Effacer le brouillon
            </Button>
          )}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            onClick={onCancel || (() => window.history.back())}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" /> Sauvegarde...
              </span>
            ) : (
              'Enregistrer le dossier'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
