import { z } from 'zod';
import { WILAYAS } from './wilayas';

const wilayaTuple = ['', ...WILAYAS] as const;
const sexeTuple = ['', 'Féminin', 'Masculin'] as const;
const ynnpTuple = ['', 'Oui', 'Non', 'Non précisé'] as const;
const cdtTuple = ['', 'CPT', 'CVT', 'COT'] as const;
const varianteTuple = ['', 'Vésiculaire', 'Oncocytaire', 'Trabéculaire solide', 'NIFTP'] as const;
const tailleTuple = ['', '<2', '=2', '>2'] as const;
const macroTuple = ['', 'Microscopique', 'Macroscopique'] as const;
const evCountTuple = ['', '< 4', '≥ 4'] as const;
const mitosesTuple = ['', '<3', '≥3', 'Non précisé'] as const;
const rTuple = ['', 'R0', 'R1', 'R2'] as const;
const tTuple = ['', 'T1', 'T1a', 'T1b', 'T2', 'T3a', 'T3b', 'T4'] as const;
const nTuple = ['', 'N0', 'Nx', 'N1a', 'N1b'] as const;
const mTuple = ['', 'M0', 'Mx', 'M1'] as const;
const chirTuple = ['', 'TT', 'TST', 'TP'] as const;
const tpsTuple = ['', '1', '2', '3'] as const;
const reponseTuple = ['', 'RC', 'Récidive', 'RP', 'RS', 'PD', 'Perdu de vue'] as const;
const dcdTuple = ['', 'Oui', 'Non', 'Perdu de vue'] as const;

const num150 = z.number().min(0).max(150);
const num600 = z.number().min(0).max(600);
const num10000 = z.number().min(0).max(10000);
const num50 = z.number().min(0).max(50);

export const medicalRecordSchema = z.object({
  id: z.string().optional(),

  numeroDossier: z
    .string()
    .regex(/^[A-Z0-9]{3}\/[0-9]{2}$/, 'Format requis : XXX/AA (ex : 123/24)'),
  nom: z.string().min(1, 'Le nom est requis').max(100),
  prenoms: z.string().min(1, 'Les prénoms sont requis').max(150),

  sexe: z.enum(sexeTuple),
  ddn: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  wilaya: z.enum(wilayaTuple),

  atcdFamCdt: z.enum(ynnpTuple),
  atcdFamCancer: z.enum(ynnpTuple),
  atcdPersCancer: z.enum(ynnpTuple),

  ageDgc: num150,

  cdt: z.enum(cdtTuple),
  variante: z.enum(varianteTuple),
  taille: z.enum(tailleTuple),
  ec: z.enum(ynnpTuple),
  macroMicro: z.enum(macroTuple),
  ev: z.enum(ynnpTuple),
  evCount: z.enum(evCountTuple),
  mitoses: z.enum(mitosesTuple),
  hgie: z.enum(ynnpTuple),
  nse: z.enum(ynnpTuple),
  filetNerv: z.enum(ynnpTuple),

  r: z.enum(rTuple),
  t: z.enum(tTuple),
  n: z.enum(nTuple),
  m: z.enum(mTuple),

  chir: z.enum(chirTuple),
  cg: z.enum(ynnpTuple),
  tps: z.enum(tpsTuple),

  dgcI1: num600,
  chirI1: num600,
  nbreCures: num50,
  actCum: num10000,
  suivi: num150,

  rep2ans: z.enum(reponseTuple),
  rep5ans: z.enum(reponseTuple),
  rep10ans: z.enum(reponseTuple),

  dcd: z.enum(dcdTuple),
  dcdAge: num150,
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;

export type StoredMedicalRecord = MedicalRecordFormValues & {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
};

export const RECORD_FIELD_ORDER: (keyof MedicalRecordFormValues)[] = [
  'numeroDossier', 'nom', 'prenoms', 'sexe', 'ddn', 'wilaya',
  'atcdFamCdt', 'atcdFamCancer', 'atcdPersCancer', 'ageDgc',
  'cdt', 'variante', 'taille', 'ec', 'macroMicro', 'ev', 'evCount',
  'mitoses', 'hgie', 'nse', 'filetNerv', 'r', 't', 'n', 'm',
  'chir', 'cg', 'tps', 'dgcI1', 'chirI1', 'nbreCures', 'actCum', 'suivi',
  'rep2ans', 'rep5ans', 'rep10ans', 'dcd', 'dcdAge',
];

export const RECORD_FIELD_LABELS: Record<keyof MedicalRecordFormValues, string> = {
  id: 'ID',
  numeroDossier: 'Numéro du dossier',
  nom: 'Nom',
  prenoms: 'Prénoms',
  sexe: 'Sexe',
  ddn: 'Date de naissance',
  wilaya: 'Wilaya',
  atcdFamCdt: 'ATCD Fam CDT',
  atcdFamCancer: 'ATCD Fam Cancer',
  atcdPersCancer: 'ATCD Pers Cancer',
  ageDgc: 'Âge au diagnostic (années)',
  cdt: 'CDT',
  variante: 'Variante',
  taille: '∑ (taille)',
  ec: 'EC (Extension Capsulaire)',
  macroMicro: 'Macro / micro',
  ev: 'EV (Emboles Vasculaires)',
  evCount: 'Taille EV (< 4 / ≥ 4)',
  mitoses: 'Mitoses',
  hgie: 'Hémorragie',
  nse: 'Nse (Nécrose)',
  filetNerv: 'Filet Nerveux',
  r: 'R',
  t: 'T',
  n: 'N',
  m: 'M',
  chir: 'Chir',
  cg: 'CG (Curage Ganglionnaire)',
  tps: 'tps (Temps)',
  dgcI1: 'Dgc à I1 (mois)',
  chirI1: 'Chir à I1 (mois)',
  nbreCures: 'Nombre de cures',
  actCum: 'Activité cumulée (mCi)',
  suivi: 'Suivi (années)',
  rep2ans: 'Réponse à 2 ans',
  rep5ans: 'Réponse à 5 ans',
  rep10ans: 'Réponse à 10 ans',
  dcd: 'DCD',
  dcdAge: 'Âge du décès',
};

export const RECORD_DEFAULTS: MedicalRecordFormValues = {
  numeroDossier: '',
  nom: '',
  prenoms: '',
  sexe: '',
  ddn: '',
  wilaya: '',
  atcdFamCdt: '',
  atcdFamCancer: '',
  atcdPersCancer: '',
  ageDgc: 0,
  cdt: '',
  variante: '',
  taille: '',
  ec: '',
  macroMicro: '',
  ev: '',
  evCount: '',
  mitoses: '',
  hgie: '',
  nse: '',
  filetNerv: '',
  r: '',
  t: '',
  n: '',
  m: '',
  chir: '',
  cg: '',
  tps: '',
  dgcI1: 0,
  chirI1: 0,
  nbreCures: 0,
  actCum: 0,
  suivi: 0,
  rep2ans: '',
  rep5ans: '',
  rep10ans: '',
  dcd: '',
  dcdAge: 0,
};

export function formatTNM(r: Pick<MedicalRecordFormValues, 't' | 'n' | 'm'>): string {
  const parts = [r.t, r.n, r.m].filter(Boolean);
  return parts.length ? parts.join('') : '—';
}
