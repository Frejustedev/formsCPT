import type { MedicalRecordFormValues, StoredMedicalRecord } from '@/lib/schemas';
import type { DbAdapter, DraftEntry, LogEntry, RecordVersion } from './types';

type ElectronAPI = {
  records: {
    list: () => Promise<StoredMedicalRecord[]>;
    get: (id: string) => Promise<StoredMedicalRecord | null>;
    create: (id: string, data: MedicalRecordFormValues) => Promise<StoredMedicalRecord>;
    update: (id: string, data: MedicalRecordFormValues) => Promise<StoredMedicalRecord>;
    delete: (id: string) => Promise<void>;
    checkUnique: (numero: string, excludeId?: string) => Promise<boolean>;
    versions: (id: string) => Promise<RecordVersion[]>;
    onChanged: (callback: () => void) => () => void;
  };
  drafts: {
    get: () => Promise<DraftEntry | null>;
    save: (data: MedicalRecordFormValues) => Promise<void>;
    clear: () => Promise<void>;
  };
  logs: {
    list: (limit?: number) => Promise<LogEntry[]>;
    add: (action: string, details?: string) => Promise<void>;
  };
  app: {
    dataLocation: () => Promise<string>;
    exportBackup: () => Promise<{ filename: string; bytes: ArrayBuffer }>;
    importBackup: (bytes: ArrayBuffer) => Promise<void>;
  };
};

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export class ElectronAdapter implements DbAdapter {
  readonly platform = 'electron' as const;
  private api: ElectronAPI;

  constructor() {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('ElectronAPI not available');
    }
    this.api = window.electronAPI;
  }

  async ready() {}

  listRecords() {
    return this.api.records.list();
  }
  getRecord(id: string) {
    return this.api.records.get(id);
  }
  createRecord(id: string, data: MedicalRecordFormValues) {
    return this.api.records.create(id, data);
  }
  updateRecord(id: string, data: MedicalRecordFormValues) {
    return this.api.records.update(id, data);
  }
  deleteRecord(id: string) {
    return this.api.records.delete(id);
  }
  isNumeroDossierTaken(numero: string, excludeId?: string) {
    return this.api.records.checkUnique(numero, excludeId);
  }
  listVersions(recordId: string) {
    return this.api.records.versions(recordId);
  }

  getDraft() {
    return this.api.drafts.get();
  }
  saveDraft(data: MedicalRecordFormValues) {
    return this.api.drafts.save(data);
  }
  clearDraft() {
    return this.api.drafts.clear();
  }

  listLogs(limit?: number) {
    return this.api.logs.list(limit);
  }
  addLog(action: string, details?: string) {
    return this.api.logs.add(action, details);
  }

  onRecordsChanged(callback: () => void) {
    return this.api.records.onChanged(callback);
  }

  async getDataLocation() {
    return this.api.app.dataLocation();
  }
  exportBackup() {
    return this.api.app.exportBackup();
  }
  importBackup(bytes: ArrayBuffer) {
    return this.api.app.importBackup(bytes);
  }
}
