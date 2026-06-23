const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('passvault', {
  getRecoveredData: () => ipcRenderer.invoke('get-recovered-data'),
});
