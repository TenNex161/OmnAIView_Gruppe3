import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from "path";
import { omnaiscopeBackendManager } from './omnaiBackend';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Detect OS
const detectOs = (): string => {
  const os = require('os');
  if (os.platform() === "win32" || os.platform() === "linux") {
    console.log("os.platform()");
    return os.platform();
  } else {
    throw new Error("OS not supported!");
  }
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });
  const indexPath: string = path.join(__dirname, "..", "res", "angular", "browser", "index.csr.html");
  mainWindow.loadFile(indexPath).catch(err => console.error("Fehler beim Laden der HTML-Datei:", err));
};

omnaiscopeBackendManager.startBackend(detectOs.toString());

ipcMain.handle('get-omnaiscope-backend-port', async () => {
  return omnaiscopeBackendManager.getPort();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {

  omnaiscopeBackendManager.stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
