import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const IS_DEV = process.env.NODE_ENV === 'development';

// In production, electron-builder places extraResources under process.resourcesPath
// In dev, use the relative path to the backend package
const BACKEND_PATH = IS_DEV
    ? path.join(__dirname, '../../backend/dist/index.js')
    : path.join(process.resourcesPath, 'backend', 'dist', 'index.js');

function startBackend() {
    if (IS_DEV) return; // In dev, run backend separately

    // Use a writable location for the SQLite database in the packaged app
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'apexload.db');

    // Ensure the backend working directory exists
    const backendDir = path.join(process.resourcesPath, 'backend');

    console.log('[Main] Starting backend...');
    console.log('[Main] Backend path:', BACKEND_PATH);
    console.log('[Main] Database path:', dbPath);
    console.log('[Main] Backend exists:', fs.existsSync(BACKEND_PATH));

    // In packaged app, 'node' isn't on PATH. Use Electron's own binary
    // with ELECTRON_RUN_AS_NODE=1 to make it behave as plain Node.js
    backendProcess = spawn(process.execPath, [BACKEND_PATH], {
        stdio: 'pipe',
        cwd: backendDir,
        env: {
            ...process.env,
            NODE_ENV: 'production',
            ELECTRON_RUN_AS_NODE: '1',
            DATABASE_URL: `file:${dbPath}`,
        }
    });

    backendProcess.stdout?.on('data', (d) => console.log('[Backend]', d.toString()));
    backendProcess.stderr?.on('data', (d) => console.error('[Backend Error]', d.toString()));
    backendProcess.on('error', (err) => console.error('[Backend Spawn Error]', err));
    backendProcess.on('exit', (code) => console.log('[Backend] Process exited with code:', code));
}

function createWindow() {
    const iconPath = IS_DEV
        ? path.join(__dirname, '../public/icon.png')
        : path.join(process.resourcesPath, 'icon.png');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        backgroundColor: '#0f172a',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: iconPath,
    });

    if (IS_DEV) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    startBackend();
    setTimeout(createWindow, IS_DEV ? 0 : 1500); // Wait for backend in prod
});

app.on('window-all-closed', () => {
    backendProcess?.kill();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    backendProcess?.kill();
});

// Open reports in browser
ipcMain.handle('open-report', async (_, filePath: string) => {
    await shell.openPath(filePath);
});

ipcMain.handle('save-report', async (_, { html, filename }: { html: string; filename: string }) => {
    const { dialog } = require('electron');
    const fsMod = require('fs');
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: filename,
        filters: [{ name: 'HTML Report', extensions: ['html'] }]
    });
    if (!result.canceled && result.filePath) {
        fsMod.writeFileSync(result.filePath, html);
        return result.filePath;
    }
    return null;
});
