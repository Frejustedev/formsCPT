import type { MedicalRecordFormValues, StoredMedicalRecord } from '@/lib/schemas';
import type { DbAdapter, DraftEntry, LogEntry, RecordVersion } from './types';
import { RECORD_DEFAULTS } from '@/lib/schemas';

const DB_NAME = 'registre_cdt';
const DB_VERSION = 1;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  numeroDossier TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenoms TEXT NOT NULL,
  sexe TEXT NOT NULL DEFAULT '',
  ddn TEXT NOT NULL DEFAULT '',
  wilaya TEXT NOT NULL DEFAULT '',
  atcdFamCdt TEXT NOT NULL DEFAULT '',
  atcdFamCancer TEXT NOT NULL DEFAULT '',
  atcdPersCancer TEXT NOT NULL DEFAULT '',
  ageDgc INTEGER NOT NULL DEFAULT 0,
  cdt TEXT NOT NULL DEFAULT '',
  variante TEXT NOT NULL DEFAULT '',
  taille TEXT NOT NULL DEFAULT '',
  ec TEXT NOT NULL DEFAULT '',
  macroMicro TEXT NOT NULL DEFAULT '',
  ev TEXT NOT NULL DEFAULT '',
  evCount TEXT NOT NULL DEFAULT '',
  mitoses TEXT NOT NULL DEFAULT '',
  hgie TEXT NOT NULL DEFAULT '',
  nse TEXT NOT NULL DEFAULT '',
  filetNerv TEXT NOT NULL DEFAULT '',
  r TEXT NOT NULL DEFAULT '',
  t TEXT NOT NULL DEFAULT '',
  n TEXT NOT NULL DEFAULT '',
  m TEXT NOT NULL DEFAULT '',
  chir TEXT NOT NULL DEFAULT '',
  cg TEXT NOT NULL DEFAULT '',
  tps TEXT NOT NULL DEFAULT '',
  dgcI1 INTEGER NOT NULL DEFAULT 0,
  chirI1 INTEGER NOT NULL DEFAULT 0,
  nbreCures INTEGER NOT NULL DEFAULT 0,
  actCum REAL NOT NULL DEFAULT 0,
  suivi INTEGER NOT NULL DEFAULT 0,
  rep2ans TEXT NOT NULL DEFAULT '',
  rep5ans TEXT NOT NULL DEFAULT '',
  rep10ans TEXT NOT NULL DEFAULT '',
  dcd TEXT NOT NULL DEFAULT '',
  dcdAge INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_records_numero ON records(numeroDossier);
CREATE INDEX IF NOT EXISTS idx_records_createdAt ON records(createdAt DESC);

CREATE TABLE IF NOT EXISTS record_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recordId TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (recordId) REFERENCES records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_versions_record ON record_versions(recordId, createdAt DESC);

CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  draftData TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
`;

type SQLiteConnection = {
  execute: (statement: string) => Promise<unknown>;
  query: (statement: string, values?: unknown[]) => Promise<{ values?: Record<string, unknown>[] }>;
  run: (statement: string, values?: unknown[]) => Promise<{ changes: { changes: number } }>;
};

type SQLiteModule = {
  CapacitorSQLite: {
    addListener?: (event: string, cb: (...args: unknown[]) => void) => Promise<unknown>;
  };
  SQLiteConnection: new (sqlite: unknown) => {
    createConnection: (
      name: string,
      encrypted: boolean,
      mode: string,
      version: number,
      readOnly: boolean,
    ) => Promise<SQLiteConnection>;
    isConnection: (name: string, readOnly: boolean) => Promise<{ result: boolean }>;
    closeConnection: (name: string, readOnly: boolean) => Promise<unknown>;
  };
};

const RECORD_COLUMNS = [
  'numeroDossier', 'nom', 'prenoms', 'sexe', 'ddn', 'wilaya',
  'atcdFamCdt', 'atcdFamCancer', 'atcdPersCancer', 'ageDgc',
  'cdt', 'variante', 'taille', 'ec', 'macroMicro', 'ev', 'evCount',
  'mitoses', 'hgie', 'nse', 'filetNerv', 'r', 't', 'n', 'm',
  'chir', 'cg', 'tps', 'dgcI1', 'chirI1', 'nbreCures', 'actCum', 'suivi',
  'rep2ans', 'rep5ans', 'rep10ans', 'dcd', 'dcdAge',
] as const;

function rowToRecord(row: Record<string, unknown>): StoredMedicalRecord {
  const out: Record<string, unknown> = { ...RECORD_DEFAULTS };
  for (const col of RECORD_COLUMNS) {
    const v = row[col];
    if (v != null) out[col] = v;
  }
  out.id = String(row.id);
  out.userId = 'local';
  out.createdAt = Number(row.createdAt ?? 0);
  out.updatedAt = Number(row.updatedAt ?? 0);
  return out as StoredMedicalRecord;
}

export class CapacitorAdapter implements DbAdapter {
  readonly platform = 'capacitor' as const;
  private conn: SQLiteConnection | null = null;
  private listeners = new Set<() => void>();
  private initPromise: Promise<void> | null = null;

  async ready() {
    if (!this.initPromise) this.initPromise = this.init();
    return this.initPromise;
  }

  private async init() {
    const sqliteImport = (await import('@capacitor-community/sqlite')) as unknown as SQLiteModule;
    const sqlite = new sqliteImport.SQLiteConnection(sqliteImport.CapacitorSQLite);
    const isConn = await sqlite.isConnection(DB_NAME, false);
    if (isConn.result) {
      await sqlite.closeConnection(DB_NAME, false);
    }
    this.conn = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
    await (this.conn as unknown as { open: () => Promise<unknown> }).open();
    await this.conn.execute(SCHEMA_SQL);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private requireConn(): SQLiteConnection {
    if (!this.conn) throw new Error('SQLite not initialized');
    return this.conn;
  }

  async listRecords(): Promise<StoredMedicalRecord[]> {
    await this.ready();
    const result = await this.requireConn().query('SELECT * FROM records ORDER BY createdAt DESC', []);
    return (result.values ?? []).map(rowToRecord);
  }

  async getRecord(id: string) {
    await this.ready();
    const result = await this.requireConn().query('SELECT * FROM records WHERE id = ?', [id]);
    const rows = result.values ?? [];
    return rows.length ? rowToRecord(rows[0]) : null;
  }

  async createRecord(id: string, data: MedicalRecordFormValues) {
    await this.ready();
    const now = Date.now();
    const cols = ['id', ...RECORD_COLUMNS, 'createdAt', 'updatedAt'];
    const placeholders = cols.map(() => '?').join(', ');
    const values: unknown[] = [
      id,
      ...RECORD_COLUMNS.map((c) => (data as Record<string, unknown>)[c] ?? RECORD_DEFAULTS[c as keyof typeof RECORD_DEFAULTS]),
      now,
      now,
    ];
    await this.requireConn().run(
      `INSERT INTO records (${cols.join(', ')}) VALUES (${placeholders})`,
      values,
    );
    this.notify();
    const fetched = await this.getRecord(id);
    if (!fetched) throw new Error('Failed to create record');
    return fetched;
  }

  async updateRecord(id: string, data: MedicalRecordFormValues) {
    await this.ready();
    const existing = await this.getRecord(id);
    if (!existing) throw new Error(`Record ${id} not found`);
    const now = Date.now();
    await this.requireConn().run(
      'INSERT INTO record_versions (recordId, snapshot, createdAt) VALUES (?, ?, ?)',
      [id, JSON.stringify(existing), now],
    );
    const setClauses = [...RECORD_COLUMNS, 'updatedAt'].map((c) => `${c} = ?`).join(', ');
    const values: unknown[] = [
      ...RECORD_COLUMNS.map((c) => (data as Record<string, unknown>)[c] ?? RECORD_DEFAULTS[c as keyof typeof RECORD_DEFAULTS]),
      now,
      id,
    ];
    await this.requireConn().run(`UPDATE records SET ${setClauses} WHERE id = ?`, values);
    this.notify();
    const fetched = await this.getRecord(id);
    if (!fetched) throw new Error('Failed to update record');
    return fetched;
  }

  async deleteRecord(id: string) {
    await this.ready();
    await this.requireConn().run('DELETE FROM records WHERE id = ?', [id]);
    this.notify();
  }

  async isNumeroDossierTaken(numero: string, excludeId?: string) {
    if (!numero) return false;
    await this.ready();
    const result = await this.requireConn().query(
      'SELECT id FROM records WHERE numeroDossier = ?',
      [numero],
    );
    const rows = result.values ?? [];
    if (excludeId) return rows.some((r) => r.id !== excludeId);
    return rows.length > 0;
  }

  async listVersions(recordId: string): Promise<RecordVersion[]> {
    await this.ready();
    const result = await this.requireConn().query(
      'SELECT id, recordId, snapshot, createdAt FROM record_versions WHERE recordId = ? ORDER BY createdAt DESC',
      [recordId],
    );
    return (result.values ?? []).map((r) => ({
      id: Number(r.id),
      recordId: String(r.recordId),
      snapshot: String(r.snapshot),
      createdAt: Number(r.createdAt),
    }));
  }

  async getDraft(): Promise<DraftEntry | null> {
    await this.ready();
    const result = await this.requireConn().query('SELECT draftData, updatedAt FROM drafts WHERE id = 1', []);
    const rows = result.values ?? [];
    if (!rows.length) return null;
    return {
      data: JSON.parse(String(rows[0].draftData)) as MedicalRecordFormValues,
      updatedAt: Number(rows[0].updatedAt),
    };
  }

  async saveDraft(data: MedicalRecordFormValues) {
    await this.ready();
    await this.requireConn().run(
      'INSERT INTO drafts (id, draftData, updatedAt) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET draftData = excluded.draftData, updatedAt = excluded.updatedAt',
      [JSON.stringify(data), Date.now()],
    );
  }

  async clearDraft() {
    await this.ready();
    await this.requireConn().run('DELETE FROM drafts WHERE id = 1', []);
  }

  async listLogs(limit = 200): Promise<LogEntry[]> {
    await this.ready();
    const result = await this.requireConn().query(
      'SELECT id, action, details, timestamp FROM logs ORDER BY timestamp DESC LIMIT ?',
      [limit],
    );
    return (result.values ?? []).map((r) => ({
      id: Number(r.id),
      action: String(r.action ?? ''),
      details: String(r.details ?? ''),
      timestamp: Number(r.timestamp),
    }));
  }

  async addLog(action: string, details = '') {
    await this.ready();
    await this.requireConn().run(
      'INSERT INTO logs (action, details, timestamp) VALUES (?, ?, ?)',
      [action, details, Date.now()],
    );
  }

  onRecordsChanged(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async getDataLocation() {
    return 'Stockage interne de l\'application (sandboxé par le système)';
  }

  async exportBackup() {
    const records = await this.listRecords();
    const logs = await this.listLogs(10000);
    const payload = {
      version: 1,
      platform: 'capacitor',
      exportedAt: new Date().toISOString(),
      records,
      logs,
    };
    const json = JSON.stringify(payload, null, 2);
    const bytes = new TextEncoder().encode(json).buffer;
    return { filename: `RegistreCDT-backup-${Date.now()}.json`, bytes };
  }

  async importBackup(bytes: ArrayBuffer) {
    await this.ready();
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as {
      records?: StoredMedicalRecord[];
      logs?: LogEntry[];
    };
    if (parsed.records) {
      const conn = this.requireConn();
      for (const r of parsed.records) {
        const cols = ['id', ...RECORD_COLUMNS, 'createdAt', 'updatedAt'];
        const placeholders = cols.map(() => '?').join(', ');
        const values: unknown[] = [
          r.id,
          ...RECORD_COLUMNS.map((c) => (r as Record<string, unknown>)[c] ?? RECORD_DEFAULTS[c as keyof typeof RECORD_DEFAULTS]),
          r.createdAt,
          r.updatedAt,
        ];
        await conn.run(
          `INSERT OR REPLACE INTO records (${cols.join(', ')}) VALUES (${placeholders})`,
          values,
        );
      }
    }
    this.notify();
  }
}
