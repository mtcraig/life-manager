const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  getInitialTheme: () => ipcRenderer.sendSync('get-theme'),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),
});
