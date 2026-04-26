'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { medicalRecordSchema, MedicalRecordFormValues } from '@/lib/schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RecordFormProps {
  initialValues?: Partial<MedicalRecordFormValues>;
  onSubmit: (data: MedicalRecordFormValues) => void;
  isSubmitting?: boolean;
}

export function RecordForm({ initialValues, onSubmit, isSubmitting }: RecordFormProps) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
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

  const renderSelect = (name: keyof MedicalRecordFormValues, label: string, options: {value: string, label: string}[]) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value as string}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">
      <Card>
        <CardHeader>
          <CardTitle>Identification</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="numeroDossier">Numéro du dossier</Label>
            <Input id="numeroDossier" {...register('numeroDossier')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" {...register('nom')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prenoms">Prénoms</Label>
            <Input id="prenoms" {...register('prenoms')} />
          </div>
          {renderSelect('sexe', 'Sexe', [
            { value: 'M', label: 'M' },
            { value: 'F', label: 'F' },
            { value: 'NP', label: 'Non Précisé' },
          ])}
          <div className="space-y-1.5">
            <Label htmlFor="ddn">Date de Naissance (DDN)</Label>
            <Input id="ddn" type="date" {...register('ddn')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" {...register('adresse')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antécédents & Diagnostic</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderSelect('atcdFamCdt', 'ATCD Fam CDT', ynnpOptions)}
          {renderSelect('atcdFamCancer', 'ATCD Fam Cancer', ynnpOptions)}
          {renderSelect('atcdPersCancer', 'ATCD Pers Cancer', ynnpOptions)}
          <div className="space-y-1.5">
            <Label htmlFor="ageDgc">Age du Dgc</Label>
            <Input id="ageDgc" type="number" {...register('ageDgc', { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tumeur (Caractéristiques)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cdt">CDT</Label>
            <Input id="cdt" {...register('cdt')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variante">Variante</Label>
            <Input id="variante" {...register('variante')} />
          </div>
          {renderSelect('sizeSup2cm', 'Taille (∑ ≤ 2 Ou > 2 cm)', [
            { value: '<= 2', label: '≤ 2 cm' },
            { value: '> 2', label: '> 2 cm' },
            { value: 'NP', label: 'Non Précisé' },
          ])}
          {renderSelect('ec', 'EC', ynnpOptions)}
          {renderSelect('macroMicro', 'Macro ou micro', [
            { value: 'M', label: 'Macro' },
            { value: 'm', label: 'micro' },
            { value: 'NP', label: 'Non Précisé' },
          ])}
          {renderSelect('ev', 'EV (< 4 Ou ≥ 4)', [
            { value: '< 4', label: '< 4' },
            { value: '>= 4', label: '≥ 4' },
            { value: 'NP', label: 'Non Précisé' },
          ])}
          {renderSelect('mitoses', 'Mitoses (< 3 ou ≥ 3)', [
            { value: '< 3', label: '< 3' },
            { value: '>= 3', label: '≥ 3' },
            { value: 'NP', label: 'Non Précisé' },
          ])}
          {renderSelect('hgie', 'Hgie (Hémorragie)', ynnpOptions)}
          {renderSelect('nse', 'Nse (Nécrose)', ynnpOptions)}
          {renderSelect('filetNerv', 'Filet Nerv', ynnpOptions)}
          <div className="space-y-1.5">
            <Label htmlFor="r">R</Label>
            <Input id="r" {...register('r')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t">T</Label>
            <Input id="t" {...register('t')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n">N</Label>
            <Input id="n" {...register('n')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m">M</Label>
            <Input id="m" {...register('m')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traitement et Suivi</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderSelect('chir', 'Chirurgie', [
            { value: 'TT', label: 'TT' },
            { value: 'TST', label: 'TST' },
            { value: 'TP', label: 'TP' },
            { value: 'NP', label: 'Non Précisé' },
          ])}
          <div className="space-y-1.5">
            <Label htmlFor="cg">CG</Label>
            <Input id="cg" {...register('cg')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tps">tps</Label>
            <Input id="tps" {...register('tps')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dgcI1">Dgc à I1 (mois)</Label>
            <Input id="dgcI1" type="number" {...register('dgcI1', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chirI1">Chir à I1 (mois)</Label>
            <Input id="chirI1" type="number" {...register('chirI1', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nbreCures">Nbre de cures</Label>
            <Input id="nbreCures" type="number" {...register('nbreCures', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="actCum">Act Cum (mCi)</Label>
            <Input id="actCum" type="number" {...register('actCum', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suivi">Suivi (années)</Label>
            <Input id="suivi" type="number" {...register('suivi', { valueAsNumber: true })} />
          </div>
          
          {renderSelect('rep2ans', 'Rép à 2 ans', repOptions)}
          {renderSelect('rep5ans', 'Rép à 5 ans', repOptions)}
          {renderSelect('rep10ans', 'Rép à 10 ans', repOptions)}
          
          {renderSelect('dcd', 'DCD', ynnpOptions)}
          
          {dcdWatcher === 'O' && (
            <div className="space-y-1.5 border-l-2 border-blue-500 pl-3">
              <Label htmlFor="dcdAge">Si oui, âge du décès</Label>
              <Input id="dcdAge" type="number" {...register('dcdAge', { valueAsNumber: true })} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 sticky bottom-4 p-4 bg-white/80 backdrop-blur-md border rounded-lg shadow-sm">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
