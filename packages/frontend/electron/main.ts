import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const BACKEND_PATH = path.join(__dirname, '../../backend/dist/index.js');
const IS_DEV = process.env.NODE_ENV === 'development';

function startBackend() {
    if (IS_DEV) return; // In dev, run backend separately
    backendProcess = spawn('node', [BACKEND_PATH], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' }
    });
    backendProcess.stdout?.on('data', (d) => console.log('[Backend]', d.toString()));
    backendProcess.stderr?.on('data', (d) => console.error('[Backend Error]', d.toString()));
}

function createWindow() {
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
        icon: path.join(__dirname, '../public/icon.png'),
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

// Open reports in browser
ipcMain.handle('open-report', async (_, filePath: string) => {
    await shell.openPath(filePath);
});

ipcMain.handle('save-report', async (_, { html, filename }: { html: string; filename: string }) => {
    const { dialog } = require('electron');
    const fs = require('fs');
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: filename,
        filters: [{ name: 'HTML Report', extensions: ['html'] }]
    });
    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, html);
        return result.filePath;
    }
    return null;
});
