const { app, BrowserWindow, Menu } = require('electron');
const { existsSync } = require('node:fs');
const path = require('node:path');

app.setName('life-manager');

let mainWindow = null;
let fastifyApp = null;

// Resources are staged at build time (npm run prepare:resources) into
// ./resources relative to this file. electron-builder packs this whole
// directory into app.asar, and __dirname resolves correctly whether running
// unpacked (`electron .`) or from inside the packaged asar - unlike
// process.resourcesPath, which points at Electron's own resources when
// unpacked and would only be correct post-packaging.
async function bootstrap() {
  process.env.DB_PATH = path.join(app.getPath('userData'), 'life-manager.db');
  process.env.STATIC_DIR = path.join(__dirname, 'resources', 'frontend');
  process.env.MIGRATIONS_DIR = path.join(__dirname, 'resources', 'backend', 'migrations');
  process.env.PORT = '0'; // OS-assigned free port - no collision with a dev backend on :4000
  process.env.NODE_ENV = 'production';

  const backendEntry = path.join(__dirname, 'resources', 'backend', 'index.cjs');
  const { startServer } = require(backendEntry);
  fastifyApp = await startServer();
  const address = fastifyApp.server.address();
  return typeof address === 'object' && address ? address.port : 4000;
}

function createWindow(port) {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    ...(existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (!app.requestSingleInstanceLock()) {
  // Another instance already owns the database/watched folders.
  app.quit();
} else {
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null); // no File/Edit/View chrome for a non-technical user

    let port;
    try {
      port = await bootstrap();
    } catch (error) {
      console.error('Failed to start the backend server:', error);
      app.quit();
      return;
    }

    createWindow(port);
  });

  app.on('window-all-closed', () => {
    app.quit(); // Windows-only scope: no macOS "stay alive with no windows" convention needed
  });

  app.on('before-quit', async () => {
    try {
      await fastifyApp?.close();
    } catch {
      // best-effort - the process is exiting either way
    }
  });
}
