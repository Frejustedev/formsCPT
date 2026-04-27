const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { initDb, registerIpc, getDataLocation } = require('./db.cjs');

const isDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;

let mainWindow = null;

function getDataDir() {
  if (app.isPackaged && process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data');
  }
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), 'data');
  }
  return path.join(__dirname, '..', 'data');
}

function ensureDataDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Registre CDT',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000').catch((e) => console.error('Failed to load dev URL', e));
  } else {
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');
    mainWindow.loadFile(indexPath).catch((e) => console.error('Failed to load file', e));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url).catch(() => null);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const dataDir = getDataDir();
  ensureDataDir(dataDir);
  initDb(path.join(dataDir, 'registre.json'));
  registerIpc(ipcMain, () => mainWindow);

  ipcMain.handle('app:dataLocation', () => getDataLocation());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url).catch(() => null);
    }
  });
});
