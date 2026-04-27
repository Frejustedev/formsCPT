import type { MedicalRecordFormValues, StoredMedicalRecord } from '@/lib/schemas';

export type LogEntry = {
  id: number;
  action: string;
  details: string;
  timestamp: number;
};

export type RecordVersion = {
  id: number;
  recordId: string;
  snapshot: string;
  createdAt: number;
};

export type DraftEntry = {
  data: MedicalRecordFormValues;
  updatedAt: number;
};

export interface DbAdapter {
  readonly platform: 'electron' | 'capacitor' | 'memory';

  ready(): Promise<void>;

  listRecords(): Promise<StoredMedicalRecord[]>;
  getRecord(id: string): Promise<StoredMedicalRecord | null>;
  createRecord(id: string, data: MedicalRecordFormValues): Promise<StoredMedicalRecord>;
  updateRecord(id: string, data: MedicalRecordFormValues): Promise<StoredMedicalRecord>;
  deleteRecord(id: string): Promise<void>;
  isNumeroDossierTaken(numero: string, excludeId?: string): Promise<boolean>;
  listVersions(recordId: string): Promise<RecordVersion[]>;

  getDraft(): Promise<DraftEntry | null>;
  saveDraft(data: MedicalRecordFormValues): Promise<void>;
  clearDraft(): Promise<void>;

  listLogs(limit?: number): Promise<LogEntry[]>;
  addLog(action: string, details?: string): Promise<void>;

  onRecordsChanged(callback: () => void): () => void;

  getDataLocation(): Promise<string | null>;
  exportBackup(): Promise<{ filename: string; bytes: ArrayBuffer }>;
  importBackup(bytes: ArrayBuffer): Promise<void>;
}
