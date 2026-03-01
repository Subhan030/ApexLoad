"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    openReport: (filePath) => electron_1.ipcRenderer.invoke('open-report', filePath),
    saveReport: (data) => electron_1.ipcRenderer.invoke('save-report', data),
    platform: process.platform,
});
