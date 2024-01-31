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
});