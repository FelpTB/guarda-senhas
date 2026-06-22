const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, 'icon.ico'), // Opcional: adicione um ícone
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Remove a barra de menu superior para parecer um app nativo
  win.setMenuBarVisibility(false);
  
  // Carrega o arquivo HTML da sua aplicação
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
