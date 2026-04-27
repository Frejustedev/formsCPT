const { contextBridge, ipcRenderer } = require('electron');

const records = {
  list: () => ipcRenderer.invoke('records:list'),
  get: (id) => ipcRenderer.invoke('records:get', id),
  create: (id, data) => ipcRenderer.invoke('records:create', id, data),
  update: (id, data) => ipcRenderer.invoke('records:update', id, data),
  delete: (id) => ipcRenderer.invoke('records:delete', id),
  checkUnique: (numero, excludeId) => ipcRenderer.invoke('records:checkUnique', numero, excludeId),
  versions: (id) => ipcRenderer.invoke('records:versions', id),
  onChanged: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('records:changed', handler);
    return () => ipcRenderer.off('records:changed', handler);
  },
};

const drafts = {
  get: () => ipcRenderer.invoke('drafts:get'),
  save: (data) => ipcRenderer.invoke('drafts:save', data),
  clear: () => ipcRenderer.invoke('drafts:clear'),
};

const logs = {
  list: (limit) => ipcRenderer.invoke('logs:list', limit),
  add: (action, details) => ipcRenderer.invoke('logs:add', action, details),
};

const appApi = {
  dataLocation: () => ipcRenderer.invoke('app:dataLocation'),
  exportBackup: () => ipcRenderer.invoke('app:exportBackup'),
  importBackup: (bytes) => ipcRenderer.invoke('app:importBackup', bytes),
};

contextBridge.exposeInMainWorld('electronAPI', {
  records,
  drafts,
  logs,
  app: appApi,
});
