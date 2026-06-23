const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { LEGACY_USER_DATA, ensureLegacyRecovery } = require('./desktop/recovery');

app.setPath('userData', LEGACY_USER_DATA);

let recoveredCache = null;

function createWindow() {
  ensureLegacyRecovery(app.getPath('userData')).then((data) => {
    recoveredCache = data;
    openMainWindow();
  }).catch(() => {
    recoveredCache = null;
    openMainWindow();
  });
}

function openMainWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'desktop', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('get-recovered-data', () => recoveredCache);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
