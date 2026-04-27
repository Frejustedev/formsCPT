import { WILAYAS } from './wilayas';

export const UNSET = '' as const;

export const SEXE_OPTIONS = ['Féminin', 'Masculin'] as const;
export const YNNP_OPTIONS = ['Oui', 'Non', 'Non précisé'] as const;
export const CDT_OPTIONS = ['CPT', 'CVT', 'COT'] as const;
export const VARIANTE_OPTIONS = ['Vésiculaire', 'Oncocytaire', 'Trabéculaire solide', 'NIFTP'] as const;
export const TAILLE_OPTIONS = ['<2', '=2', '>2'] as const;
export const MACRO_MICRO_OPTIONS = ['Microscopique', 'Macroscopique'] as const;
export const EV_COUNT_OPTIONS = ['< 4', '≥ 4'] as const;
export const MITOSES_OPTIONS = ['<3', '≥3', 'Non précisé'] as const;
export const R_OPTIONS = ['R0', 'R1', 'R2'] as const;
export const T_OPTIONS = ['T1', 'T1a', 'T1b', 'T2', 'T3a', 'T3b', 'T4'] as const;
export const N_OPTIONS = ['N0', 'Nx', 'N1a', 'N1b'] as const;
export const M_OPTIONS = ['M0', 'Mx', 'M1'] as const;
export const CHIR_OPTIONS = ['TT', 'TST', 'TP'] as const;
export const TPS_OPTIONS = ['1', '2', '3'] as const;
export const REPONSE_OPTIONS = ['RC', 'Récidive', 'RP', 'RS', 'PD', 'Perdu de vue'] as const;
export const DCD_OPTIONS = ['Oui', 'Non', 'Perdu de vue'] as const;

export const SEXE_LABELS: Record<typeof SEXE_OPTIONS[number], string> = {
  'Féminin': 'Féminin',
  'Masculin': 'Masculin',
};

export const CDT_LABELS: Record<typeof CDT_OPTIONS[number], string> = {
  CPT: 'Carcinome Papillaire (CPT)',
  CVT: 'Carcinome Vésiculaire (CVT)',
  COT: 'Carcinome Oncocytaire (COT)',
};

export const CHIR_LABELS: Record<typeof CHIR_OPTIONS[number], string> = {
  TT: 'Thyroïdectomie Totale (TT)',
  TST: 'Thyroïdectomie SubTotale (TST)',
  TP: 'Thyroïdectomie Partielle (TP)',
};

export const REPONSE_LABELS: Record<typeof REPONSE_OPTIONS[number], string> = {
  RC: 'RC — Réponse Complète',
  'Récidive': 'Récidive',
  RP: 'RP — Réponse Partielle',
  RS: 'RS — Réponse Stable',
  PD: 'PD — Progression',
  'Perdu de vue': 'Perdu de vue',
};

export type YesNoNP = typeof YNNP_OPTIONS[number];
export type Sexe = typeof SEXE_OPTIONS[number];
export type Cdt = typeof CDT_OPTIONS[number];
export type Variante = typeof VARIANTE_OPTIONS[number];
export type Taille = typeof TAILLE_OPTIONS[number];
export type MacroMicro = typeof MACRO_MICRO_OPTIONS[number];
export type EvCount = typeof EV_COUNT_OPTIONS[number];
export type Mitoses = typeof MITOSES_OPTIONS[number];
export type R = typeof R_OPTIONS[number];
export type T = typeof T_OPTIONS[number];
export type N = typeof N_OPTIONS[number];
export type M = typeof M_OPTIONS[number];
export type Chir = typeof CHIR_OPTIONS[number];
export type Tps = typeof TPS_OPTIONS[number];
export type Reponse = typeof REPONSE_OPTIONS[number];
export type Dcd = typeof DCD_OPTIONS[number];

export const NUMERIC_FIELDS = [
  'ageDgc', 'dgcI1', 'chirI1', 'nbreCures', 'actCum', 'suivi', 'dcdAge',
] as const;

export const ENUM_FIELD_VALUES = {
  sexe: SEXE_OPTIONS,
  wilaya: WILAYAS,
  atcdFamCdt: YNNP_OPTIONS,
  atcdFamCancer: YNNP_OPTIONS,
  atcdPersCancer: YNNP_OPTIONS,
  cdt: CDT_OPTIONS,
  variante: VARIANTE_OPTIONS,
  taille: TAILLE_OPTIONS,
  ec: YNNP_OPTIONS,
  macroMicro: MACRO_MICRO_OPTIONS,
  ev: YNNP_OPTIONS,
  evCount: EV_COUNT_OPTIONS,
  mitoses: MITOSES_OPTIONS,
  hgie: YNNP_OPTIONS,
  nse: YNNP_OPTIONS,
  filetNerv: YNNP_OPTIONS,
  r: R_OPTIONS,
  t: T_OPTIONS,
  n: N_OPTIONS,
  m: M_OPTIONS,
  chir: CHIR_OPTIONS,
  cg: YNNP_OPTIONS,
  tps: TPS_OPTIONS,
  rep2ans: REPONSE_OPTIONS,
  rep5ans: REPONSE_OPTIONS,
  rep10ans: REPONSE_OPTIONS,
  dcd: DCD_OPTIONS,
} as const satisfies Record<string, readonly string[]>;
