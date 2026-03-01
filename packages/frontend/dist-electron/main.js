"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
let mainWindow = null;
let backendProcess = null;
const IS_DEV = process.env.NODE_ENV === 'development';
// In production, electron-builder places extraResources under process.resourcesPath
// In dev, use the relative path to the backend package
const BACKEND_PATH = IS_DEV
    ? path_1.default.join(__dirname, '../../backend/dist/index.js')
    : path_1.default.join(process.resourcesPath, 'backend', 'dist', 'index.js');
function startBackend() {
    if (IS_DEV)
        return; // In dev, run backend separately
    backendProcess = (0, child_process_1.spawn)('node', [BACKEND_PATH], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' }
    });
    backendProcess.stdout?.on('data', (d) => console.log('[Backend]', d.toString()));
    backendProcess.stderr?.on('data', (d) => console.error('[Backend Error]', d.toString()));
}
function createWindow() {
    const iconPath = IS_DEV
        ? path_1.default.join(__dirname, '../public/icon.png')
        : path_1.default.join(process.resourcesPath, 'icon.png');
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        backgroundColor: '#0f172a',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: iconPath,
    });
    if (IS_DEV) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    startBackend();
    setTimeout(createWindow, IS_DEV ? 0 : 1500); // Wait for backend in prod
});
electron_1.app.on('window-all-closed', () => {
    backendProcess?.kill();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// Open reports in browser
electron_1.ipcMain.handle('open-report', async (_, filePath) => {
    await electron_1.shell.openPath(filePath);
});
electron_1.ipcMain.handle('save-report', async (_, { html, filename }) => {
    const { dialog } = require('electron');
    const fs = require('fs');
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: [{ name: 'HTML Report', extensions: ['html'] }]
    });
    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, html);
        return result.filePath;
    }
    return null;
});
