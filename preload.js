//preload.js ====
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadQuestions: (subject) => ipcRenderer.invoke('load-questions', subject)
});