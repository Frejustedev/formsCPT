import { describe, expect, it } from 'vitest';
import { migrateRecord } from '@/lib/migrate';

describe('migrateRecord (legacy → new schema)', () => {
  it('converts legacy single-letter codes to the new labels', () => {
    const out = migrateRecord({
      numeroDossier: '001/24',
      nom: 'TEST',
      prenoms: 'Patient',
      sexe: 'M',
      atcdFamCdt: 'O',
      atcdFamCancer: 'N',
      atcdPersCancer: 'NP',
      cdt: 'Papillaire',
      variante: 'Folliculaire',
      sizeSup2cm: '> 2',
      macroMicro: 'm',
      ev: '< 4',
      mitoses: '< 3',
      hgie: 'O',
      r: 'Rx',
      t: 'T4a',
      n: 'N1',
      m: 'Mx',
      chir: 'TT',
      cg: 'Central',
      tps: '12 min',
      rep2ans: 'NP',
      dcd: 'O',
      dcdAge: 70,
    });

    expect(out.sexe).toBe('Masculin');
    expect(out.atcdFamCdt).toBe('Oui');
    expect(out.atcdFamCancer).toBe('Non');
    expect(out.atcdPersCancer).toBe('Non précisé');
    expect(out.cdt).toBe('CPT');
    expect(out.variante).toBe('Vésiculaire');
    expect(out.taille).toBe('>2');
    expect(out.macroMicro).toBe('Microscopique');
    expect(out.ev).toBe('Oui');
    expect(out.evCount).toBe('< 4');
    expect(out.mitoses).toBe('<3');
    expect(out.hgie).toBe('Oui');
    expect(out.r).toBe('');
    expect(out.t).toBe('T4');
    expect(out.n).toBe('');
    expect(out.m).toBe('Mx');
    expect(out.chir).toBe('TT');
    expect(out.cg).toBe('Oui');
    expect(out.tps).toBe('');
    expect(out.rep2ans).toBe('Perdu de vue');
    expect(out.dcd).toBe('Oui');
    expect(out.dcdAge).toBe(70);
  });

  it('uses adresse as fallback for wilaya', () => {
    const out = migrateRecord({ adresse: 'Alger, ancien champ' });
    expect(out.wilaya).toBe('Alger, ancien champ');
  });

  it('returns defaults for missing fields', () => {
    const out = migrateRecord({});
    expect(out.numeroDossier).toBe('');
    expect(out.ageDgc).toBe(0);
  });
});
