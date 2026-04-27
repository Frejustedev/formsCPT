import type { MedicalRecordFormValues, StoredMedicalRecord } from '@/lib/schemas';
import type { DbAdapter, DraftEntry, LogEntry, RecordVersion } from './types';

type Listener = () => void;

export class MemoryAdapter implements DbAdapter {
  readonly platform = 'memory' as const;
  private records = new Map<string, StoredMedicalRecord>();
  private versions: RecordVersion[] = [];
  private versionSeq = 0;
  private draft: DraftEntry | null = null;
  private logs: LogEntry[] = [];
  private logSeq = 0;
  private listeners = new Set<Listener>();

  async ready() {}

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async listRecords(): Promise<StoredMedicalRecord[]> {
    return Array.from(this.records.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getRecord(id: string) {
    return this.records.get(id) ?? null;
  }

  async createRecord(id: string, data: MedicalRecordFormValues) {
    const now = Date.now();
    const stored: StoredMedicalRecord = {
      ...data,
      id,
      userId: 'local',
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(id, stored);
    this.notify();
    return stored;
  }

  async updateRecord(id: string, data: MedicalRecordFormValues) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Record ${id} not found`);
    this.versions.push({
      id: ++this.versionSeq,
      recordId: id,
      snapshot: JSON.stringify(existing),
      createdAt: Date.now(),
    });
    const next: StoredMedicalRecord = {
      ...existing,
      ...data,
      id,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    this.records.set(id, next);
    this.notify();
    return next;
  }

  async deleteRecord(id: string) {
    this.records.delete(id);
    this.versions = this.versions.filter((v) => v.recordId !== id);
    this.notify();
  }

  async isNumeroDossierTaken(numero: string, excludeId?: string) {
    if (!numero) return false;
    for (const r of this.records.values()) {
      if (r.numeroDossier === numero && r.id !== excludeId) return true;
    }
    return false;
  }

  async listVersions(recordId: string) {
    return this.versions
      .filter((v) => v.recordId === recordId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getDraft() {
    return this.draft;
  }

  async saveDraft(data: MedicalRecordFormValues) {
    this.draft = { data, updatedAt: Date.now() };
  }

  async clearDraft() {
    this.draft = null;
  }

  async listLogs(limit = 200) {
    return this.logs.slice(-limit).reverse();
  }

  async addLog(action: string, details = '') {
    this.logs.push({
      id: ++this.logSeq,
      action,
      details,
      timestamp: Date.now(),
    });
  }

  onRecordsChanged(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async getDataLocation() {
    return null;
  }

  async exportBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      records: Array.from(this.records.values()),
      logs: this.logs,
    };
    const json = JSON.stringify(payload, null, 2);
    const bytes = new TextEncoder().encode(json).buffer;
    return { filename: `RegistreCDT-backup-${Date.now()}.json`, bytes };
  }

  async importBackup(bytes: ArrayBuffer) {
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as {
      records?: StoredMedicalRecord[];
      logs?: LogEntry[];
    };
    if (parsed.records) {
      this.records.clear();
      parsed.records.forEach((r) => this.records.set(r.id, r));
    }
    if (parsed.logs) {
      this.logs = parsed.logs;
      this.logSeq = parsed.logs.length;
    }
    this.notify();
  }
}
