import { describe, expect, it } from 'vitest';
import {
  medicalRecordSchema,
  RECORD_DEFAULTS,
  formatTNM,
} from '@/lib/schemas';
import { ENUM_FIELD_VALUES } from '@/lib/options';

describe('medicalRecordSchema', () => {
  it('accepts a fully populated record', () => {
    const result = medicalRecordSchema.safeParse({
      ...RECORD_DEFAULTS,
      numeroDossier: 'ABC/24',
      nom: 'TEST',
      prenoms: 'Patient',
      sexe: 'Masculin',
      wilaya: 'Alger',
      atcdFamCdt: 'Non',
      ageDgc: 45,
      cdt: 'CPT',
      variante: 'Vésiculaire',
      taille: '>2',
      ec: 'Non',
      macroMicro: 'Microscopique',
      ev: 'Oui',
      evCount: '< 4',
      mitoses: '<3',
      r: 'R0',
      t: 'T2',
      n: 'N1a',
      m: 'M0',
      chir: 'TT',
      cg: 'Oui',
      tps: '1',
      dgcI1: 6,
      chirI1: 4,
      nbreCures: 2,
      actCum: 100,
      suivi: 5,
      rep2ans: 'RC',
      rep5ans: 'RC',
      rep10ans: 'RC',
      dcd: 'Non',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty record (missing mandatory fields)', () => {
    const result = medicalRecordSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an invalid numeroDossier format', () => {
    const result = medicalRecordSchema.safeParse({
      ...RECORD_DEFAULTS,
      numeroDossier: '123-24',
      nom: 'Test',
      prenoms: 'P',
    });
    expect(result.success).toBe(false);
  });

  it('rejects sexe values that are not in the enum', () => {
    const result = medicalRecordSchema.safeParse({
      ...RECORD_DEFAULTS,
      numeroDossier: '123/24',
      nom: 'Test',
      prenoms: 'P',
      sexe: 'M',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown CDT codes', () => {
    const result = medicalRecordSchema.safeParse({
      ...RECORD_DEFAULTS,
      numeroDossier: '123/24',
      nom: 'Test',
      prenoms: 'P',
      cdt: 'Papillaire',
    });
    expect(result.success).toBe(false);
  });

  it('accepts every enum value in ENUM_FIELD_VALUES', () => {
    for (const [field, values] of Object.entries(ENUM_FIELD_VALUES)) {
      for (const v of values) {
        const result = medicalRecordSchema.safeParse({
          ...RECORD_DEFAULTS,
          numeroDossier: '123/24',
          nom: 'Test',
          prenoms: 'P',
          [field]: v,
        });
        expect(result.success, `${field}=${v}`).toBe(true);
      }
    }
  });

  it('caps numeric values at 150 and rejects negatives', () => {
    const tooBig = medicalRecordSchema.safeParse({
      ...RECORD_DEFAULTS,
      numeroDossier: '123/24',
      nom: 'Test',
      prenoms: 'P',
      ageDgc: 200,
    });
    expect(tooBig.success).toBe(false);

    const negative = medicalRecordSchema.safeParse({
      ...RECORD_DEFAULTS,
      numeroDossier: '123/24',
      nom: 'Test',
      prenoms: 'P',
      ageDgc: -1,
    });
    expect(negative.success).toBe(false);
  });
});

describe('formatTNM', () => {
  it('joins non-empty TNM parts', () => {
    expect(formatTNM({ t: 'T2', n: 'N1a', m: 'M0' })).toBe('T2N1aM0');
  });

  it('skips empty parts (no NPN1NP-style artefacts)', () => {
    expect(formatTNM({ t: '', n: 'N1a', m: '' })).toBe('N1a');
  });

  it('returns em dash when nothing is set', () => {
    expect(formatTNM({ t: '', n: '', m: '' })).toBe('—');
  });
});
