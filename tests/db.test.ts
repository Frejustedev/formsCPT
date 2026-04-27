import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryAdapter } from '@/lib/db/memory';
import { RECORD_DEFAULTS } from '@/lib/schemas';

describe('MemoryAdapter (DbAdapter contract)', () => {
  let db: MemoryAdapter;

  beforeEach(() => {
    db = new MemoryAdapter();
  });

  it('starts with no records', async () => {
    expect(await db.listRecords()).toEqual([]);
  });

  it('creates and reads back a record', async () => {
    await db.createRecord('id-1', { ...RECORD_DEFAULTS, numeroDossier: '001/24', nom: 'Test', prenoms: 'P' });
    const all = await db.listRecords();
    expect(all).toHaveLength(1);
    expect(all[0].numeroDossier).toBe('001/24');
  });

  it('detects duplicate numeroDossier', async () => {
    await db.createRecord('id-1', { ...RECORD_DEFAULTS, numeroDossier: '001/24', nom: 'A', prenoms: 'B' });
    expect(await db.isNumeroDossierTaken('001/24')).toBe(true);
    expect(await db.isNumeroDossierTaken('002/24')).toBe(false);
    expect(await db.isNumeroDossierTaken('001/24', 'id-1')).toBe(false);
  });

  it('updates a record and creates a version snapshot', async () => {
    await db.createRecord('id-1', { ...RECORD_DEFAULTS, numeroDossier: '001/24', nom: 'A', prenoms: 'B' });
    await db.updateRecord('id-1', { ...RECORD_DEFAULTS, numeroDossier: '001/24', nom: 'A2', prenoms: 'B' });
    const versions = await db.listVersions('id-1');
    expect(versions).toHaveLength(1);
    const fetched = await db.getRecord('id-1');
    expect(fetched?.nom).toBe('A2');
  });

  it('deletes a record', async () => {
    await db.createRecord('id-1', { ...RECORD_DEFAULTS, numeroDossier: '001/24', nom: 'A', prenoms: 'B' });
    await db.deleteRecord('id-1');
    expect(await db.listRecords()).toHaveLength(0);
  });

  it('saves and clears a draft', async () => {
    await db.saveDraft({ ...RECORD_DEFAULTS, numeroDossier: '999/99', nom: 'Draft', prenoms: 'Test' });
    const draft = await db.getDraft();
    expect(draft?.data.numeroDossier).toBe('999/99');
    await db.clearDraft();
    expect(await db.getDraft()).toBeNull();
  });

  it('emits onRecordsChanged on writes', async () => {
    let count = 0;
    const off = db.onRecordsChanged(() => {
      count++;
    });
    await db.createRecord('id-1', { ...RECORD_DEFAULTS, numeroDossier: '001/24', nom: 'A', prenoms: 'B' });
    await db.deleteRecord('id-1');
    off();
    expect(count).toBe(2);
  });

  it('round-trips through exportBackup / importBackup', async () => {
    await db.createRecord('id-1', { ...RECORD_DEFAULTS, numeroDossier: '001/24', nom: 'A', prenoms: 'B' });
    const { bytes } = await db.exportBackup();
    const fresh = new MemoryAdapter();
    await fresh.importBackup(bytes);
    expect((await fresh.listRecords()).length).toBe(1);
  });
});
