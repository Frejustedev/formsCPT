import type { MedicalRecordFormValues, StoredMedicalRecord } from './schemas';
import { RECORD_DEFAULTS } from './schemas';

const SEXE_LEGACY: Record<string, string> = {
  M: 'Masculin',
  F: 'Féminin',
  NP: '',
};

const YNNP_LEGACY: Record<string, string> = {
  O: 'Oui',
  N: 'Non',
  NP: 'Non précisé',
};

const CDT_LEGACY: Record<string, string> = {
  Papillaire: 'CPT',
  Vésiculaire: 'CVT',
  Oncocytaire: 'COT',
  NIFTP: '',
  Autre: '',
  NP: '',
};

const VARIANTE_LEGACY: Record<string, string> = {
  Classique: '',
  Folliculaire: 'Vésiculaire',
  Solide: 'Trabéculaire solide',
  'A cellules hautes': '',
  'Sclérosante diffuse': '',
  Autre: '',
  NP: '',
};

const TAILLE_LEGACY: Record<string, string> = {
  '<= 2': '<2',
  '> 2': '>2',
  NP: '',
};

const MACRO_LEGACY: Record<string, string> = {
  M: 'Macroscopique',
  m: 'Microscopique',
  NP: '',
};

const EV_LEGACY: Record<string, string> = {
  '< 4': 'Oui',
  '>= 4': 'Oui',
  NP: 'Non précisé',
};

const EV_COUNT_FROM_LEGACY: Record<string, string> = {
  '< 4': '< 4',
  '>= 4': '≥ 4',
  NP: '',
};

const MITOSES_LEGACY: Record<string, string> = {
  '< 3': '<3',
  '>= 3': '≥3',
  NP: 'Non précisé',
};

const R_LEGACY: Record<string, string> = {
  R0: 'R0', R1: 'R1', R2: 'R2', Rx: '', NP: '',
};

const T_LEGACY: Record<string, string> = {
  T1: 'T1', T1a: 'T1a', T1b: 'T1b',
  T2: 'T2', T3: '', T3a: 'T3a', T3b: 'T3b',
  T4: 'T4', T4a: 'T4', T4b: 'T4', Tx: '', NP: '',
};

const N_LEGACY: Record<string, string> = {
  N0: 'N0', N1: '', N1a: 'N1a', N1b: 'N1b', Nx: 'Nx', NP: '',
};

const M_LEGACY: Record<string, string> = {
  M0: 'M0', M1: 'M1', Mx: 'Mx', NP: '',
};

const CHIR_LEGACY: Record<string, string> = {
  TT: 'TT', TST: 'TST', TP: 'TP', NP: '',
};

const REPONSE_LEGACY: Record<string, string> = {
  RC: 'RC',
  Récidive: 'Récidive',
  RP: 'RP',
  RS: 'RS',
  PD: 'PD',
  NP: 'Perdu de vue',
};

const DCD_LEGACY: Record<string, string> = {
  O: 'Oui',
  N: 'Non',
  NP: 'Perdu de vue',
};

function pick<T extends string>(map: Record<string, string>, raw: unknown, fallback: T = '' as T): string {
  if (raw == null) return fallback;
  const key = String(raw);
  if (key in map) return map[key];
  return key;
}

function num(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function str(raw: unknown): string {
  if (raw == null) return '';
  return String(raw);
}

export function migrateRecord(raw: Record<string, unknown>): MedicalRecordFormValues {
  const evRaw = str(raw.ev);
  const evCountRaw = str(raw.evCount);

  const cgRaw = typeof raw.cg === 'string' && ['Oui', 'Non', 'Non précisé', ''].includes(raw.cg)
    ? raw.cg
    : (raw.cg ? 'Oui' : '');
  const tpsRaw = ['1', '2', '3'].includes(str(raw.tps)) ? str(raw.tps) : '';

  return {
    ...RECORD_DEFAULTS,
    numeroDossier: str(raw.numeroDossier),
    nom: str(raw.nom),
    prenoms: str(raw.prenoms),
    sexe: pick(SEXE_LEGACY, raw.sexe),
    ddn: str(raw.ddn),
    wilaya: raw.wilaya ? str(raw.wilaya) : str(raw.adresse),
    atcdFamCdt: pick(YNNP_LEGACY, raw.atcdFamCdt),
    atcdFamCancer: pick(YNNP_LEGACY, raw.atcdFamCancer),
    atcdPersCancer: pick(YNNP_LEGACY, raw.atcdPersCancer),
    ageDgc: num(raw.ageDgc),
    cdt: pick(CDT_LEGACY, raw.cdt),
    variante: pick(VARIANTE_LEGACY, raw.variante),
    taille: raw.taille ? str(raw.taille) : pick(TAILLE_LEGACY, raw.sizeSup2cm),
    ec: pick(YNNP_LEGACY, raw.ec),
    macroMicro: pick(MACRO_LEGACY, raw.macroMicro),
    ev: evCountRaw ? pick(YNNP_LEGACY, evRaw) : pick(EV_LEGACY, evRaw),
    evCount: evCountRaw || pick(EV_COUNT_FROM_LEGACY, evRaw),
    mitoses: pick(MITOSES_LEGACY, raw.mitoses),
    hgie: pick(YNNP_LEGACY, raw.hgie),
    nse: pick(YNNP_LEGACY, raw.nse),
    filetNerv: pick(YNNP_LEGACY, raw.filetNerv),
    r: pick(R_LEGACY, raw.r),
    t: pick(T_LEGACY, raw.t),
    n: pick(N_LEGACY, raw.n),
    m: pick(M_LEGACY, raw.m),
    chir: pick(CHIR_LEGACY, raw.chir),
    cg: cgRaw,
    tps: tpsRaw,
    dgcI1: num(raw.dgcI1),
    chirI1: num(raw.chirI1),
    nbreCures: num(raw.nbreCures),
    actCum: num(raw.actCum),
    suivi: num(raw.suivi),
    rep2ans: pick(REPONSE_LEGACY, raw.rep2ans),
    rep5ans: pick(REPONSE_LEGACY, raw.rep5ans),
    rep10ans: pick(REPONSE_LEGACY, raw.rep10ans),
    dcd: pick(DCD_LEGACY, raw.dcd),
    dcdAge: num(raw.dcdAge),
  } as MedicalRecordFormValues;
}

export function migrateStoredRecord(id: string, raw: Record<string, unknown>): StoredMedicalRecord {
  return {
    id,
    userId: str(raw.userId),
    createdAt: num(raw.createdAt),
    updatedAt: num(raw.updatedAt),
    ...migrateRecord(raw),
  };
}
