const fs = require('node:fs');
const path = require('node:path');

const RECORD_COLUMNS = [
  'numeroDossier', 'nom', 'prenoms', 'sexe', 'ddn', 'wilaya',
  'atcdFamCdt', 'atcdFamCancer', 'atcdPersCancer', 'ageDgc',
  'cdt', 'variante', 'taille', 'ec', 'macroMicro', 'ev', 'evCount',
  'mitoses', 'hgie', 'nse', 'filetNerv', 'r', 't', 'n', 'm',
  'chir', 'cg', 'tps', 'dgcI1', 'chirI1', 'nbreCures', 'actCum', 'suivi',
  'rep2ans', 'rep5ans', 'rep10ans', 'dcd', 'dcdAge',
];

const NUMERIC_FIELDS = new Set(['ageDgc', 'dgcI1', 'chirI1', 'nbreCures', 'actCum', 'suivi', 'dcdAge']);

const EMPTY_DB = () => ({
  schemaVersion: 1,
  records: {},
  versions: [],
  versionSeq: 0,
  draft: null,
  logs: [],
  logSeq: 0,
});

let store = EMPTY_DB();
let dbFilePath = '';
let saving = null;
let pending = false;

function ensureNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeRecord(data) {
  const out = {};
  for (const col of RECORD_COLUMNS) {
    if (NUMERIC_FIELDS.has(col)) out[col] = ensureNumber(data[col]);
    else out[col] = data[col] != null ? String(data[col]) : '';
  }
  return out;
}

function readSync(filePath) {
  try {
    if (!fs.existsSync(filePath)) return EMPTY_DB();
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return EMPTY_DB();
    const parsed = JSON.parse(raw);
    return {
      schemaVersion: 1,
      records: parsed.records || {},
      versions: parsed.versions || [],
      versionSeq: parsed.versionSeq || (parsed.versions ? parsed.versions.length : 0),
      draft: parsed.draft || null,
      logs: parsed.logs || [],
      logSeq: parsed.logSeq || (parsed.logs ? parsed.logs.length : 0),
    };
  } catch (e) {
    console.error('Failed to read db file, starting fresh', e);
    return EMPTY_DB();
  }
}

async function persist() {
  if (saving) {
    pending = true;
    return saving;
  }
  saving = (async () => {
    try {
      const tmp = dbFilePath + '.tmp';
      const data = JSON.stringify(store);
      await fs.promises.writeFile(tmp, data, 'utf-8');
      await fs.promises.rename(tmp, dbFilePath);
    } catch (e) {
      console.error('Failed to persist db', e);
    } finally {
      saving = null;
      if (pending) {
        pending = false;
        await persist();
      }
    }
  })();
  return saving;
}

function notifyChanged(getMainWindow) {
  try {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send('records:changed');
    }
  } catch (e) {
    console.error('notifyChanged failed', e);
  }
}

function initDb(filePath) {
  dbFilePath = filePath;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  store = readSync(filePath);
  if (!fs.existsSync(filePath)) persist();
}

function getDataLocation() {
  return dbFilePath || '(non initialisé)';
}

function listRecords() {
  return Object.values(store.records).sort((a, b) => b.createdAt - a.createdAt);
}

function getRecord(id) {
  return store.records[id] || null;
}

function createRecord(id, data) {
  const now = Date.now();
  const stored = {
    id,
    userId: 'local',
    createdAt: now,
    updatedAt: now,
    ...normalizeRecord(data),
  };
  store.records[id] = stored;
  return stored;
}

function updateRecord(id, data) {
  const existing = store.records[id];
  if (!existing) throw new Error(`Record ${id} not found`);
  store.versions.push({
    id: ++store.versionSeq,
    recordId: id,
    snapshot: JSON.stringify(existing),
    createdAt: Date.now(),
  });
  const next = {
    ...existing,
    ...normalizeRecord(data),
    id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  store.records[id] = next;
  return next;
}

function deleteRecord(id) {
  delete store.records[id];
  store.versions = store.versions.filter((v) => v.recordId !== id);
}

function checkUnique(numero, excludeId) {
  if (!numero) return false;
  for (const r of Object.values(store.records)) {
    if (r.numeroDossier === numero && r.id !== excludeId) return true;
  }
  return false;
}

function listVersions(recordId) {
  return store.versions
    .filter((v) => v.recordId === recordId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getDraft() {
  return store.draft;
}

function saveDraftValue(data) {
  store.draft = { data, updatedAt: Date.now() };
}

function clearDraft() {
  store.draft = null;
}

function listLogs(limit) {
  const n = Math.max(1, Math.min(Number(limit) || 200, 5000));
  return [...store.logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, n);
}

function addLog(action, details) {
  store.logs.push({
    id: ++store.logSeq,
    action: String(action),
    details: String(details || ''),
    timestamp: Date.now(),
  });
}

function exportBackup() {
  const payload = {
    version: 1,
    platform: 'electron',
    exportedAt: new Date().toISOString(),
    records: Object.values(store.records),
    logs: store.logs,
    versions: store.versions,
  };
  const json = JSON.stringify(payload, null, 2);
  const buf = Buffer.from(json, 'utf-8');
  return {
    filename: `RegistreCDT-backup-${Date.now()}.json`,
    bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  };
}

function importBackup(bytes) {
  const buf = Buffer.from(bytes);
  const json = buf.toString('utf-8');
  const parsed = JSON.parse(json);
  if (Array.isArray(parsed.records)) {
    for (const r of parsed.records) {
      if (r && r.id) store.records[r.id] = { ...r, userId: 'local' };
    }
  }
  if (Array.isArray(parsed.versions)) {
    store.versions.push(...parsed.versions);
    store.versionSeq = Math.max(store.versionSeq, parsed.versions.length);
  }
}

function registerIpc(ipcMain, getMainWindow) {
  const wrap = (fn) => async (...args) => {
    const result = await fn(...args);
    persist().catch((e) => console.error('persist failed', e));
    return result;
  };

  ipcMain.handle('records:list', () => listRecords());
  ipcMain.handle('records:get', (_e, id) => getRecord(id));
  ipcMain.handle('records:create', wrap(async (_e, id, data) => {
    const r = createRecord(id, data);
    notifyChanged(getMainWindow);
    return r;
  }));
  ipcMain.handle('records:update', wrap(async (_e, id, data) => {
    const r = updateRecord(id, data);
    notifyChanged(getMainWindow);
    return r;
  }));
  ipcMain.handle('records:delete', wrap(async (_e, id) => {
    deleteRecord(id);
    notifyChanged(getMainWindow);
  }));
  ipcMain.handle('records:checkUnique', (_e, numero, excludeId) => checkUnique(numero, excludeId));
  ipcMain.handle('records:versions', (_e, id) => listVersions(id));

  ipcMain.handle('drafts:get', () => getDraft());
  ipcMain.handle('drafts:save', wrap(async (_e, data) => {
    saveDraftValue(data);
  }));
  ipcMain.handle('drafts:clear', wrap(async () => {
    clearDraft();
  }));

  ipcMain.handle('logs:list', (_e, limit) => listLogs(limit));
  ipcMain.handle('logs:add', wrap(async (_e, action, details) => {
    addLog(action, details);
  }));

  ipcMain.handle('app:exportBackup', () => exportBackup());
  ipcMain.handle('app:importBackup', wrap(async (_e, bytes) => {
    importBackup(bytes);
    notifyChanged(getMainWindow);
  }));
}

module.exports = { initDb, registerIpc, getDataLocation };
