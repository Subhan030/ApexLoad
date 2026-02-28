import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    openReport: (filePath: string) => ipcRenderer.invoke('open-report', filePath),
    saveReport: (data: { html: string; filename: string }) => ipcRenderer.invoke('save-report', data),
    platform: process.platform,
});
