const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('renderer', {
    sendLoginMessage: () => {
        ipcRenderer.send('LOGIN');
    },
    sendSignoutMessage: () => {
        ipcRenderer.send('LOGOUT');
    },
    sendSeeProfileMessage: () => {
        ipcRenderer.send('GET_PROFILE');
    },
    handleProfileData: (func) => {
        ipcRenderer.on('SET_PROFILE', (event, ...args) => func(event, ...args));
    },
    showWelcomeMessage: (func) => {
        ipcRenderer.on('SHOW_WELCOME_MESSAGE', (event, ...args) => func(event, ...args));
    },
    sendStartMonitorMessage: () => {
        ipcRenderer.on('START_MONITORING', (event, ...args) => func(event, ...args));
    },
    sendStopMonitorMessage: () => {
        ipcRenderer.on('STOP_MONITORING', (event, ...args) => func(event, ...args));
    },
    sendRegisterMessage: () => {
        ipcRenderer.on('REGISTER', (event, ...args) => func(event, ...args));
    },
    sendTestMessage: () => {
        ipcRenderer.send('TEST');
    },
    sendSubmitMessage: () => {
        ipcRenderer.on('SUBMIT', (event, ...args) => func(event, ...args));
    },
});