const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronStore", {
  get: (key) => ipcRenderer.invoke("getStoreValue", key),
  set: (key, value) => ipcRenderer.send("setStoreValue", key, value),
  delete: (key) => ipcRenderer.send("deleteStoreValue", key),
});

contextBridge.exposeInMainWorld("api", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});

contextBridge.exposeInMainWorld("renderer", {
  sendLoginMessage: () => {
    ipcRenderer.send("LOGIN");
  },
  sendSignoutMessage: () => {
    ipcRenderer.send("LOGOUT");
  },
  sendSeeProfileMessage: () => {
    ipcRenderer.send("GET_PROFILE");
  },
  handleProfileData: (func) => {
    ipcRenderer.on("SET_PROFILE", (event, ...args) => func(event, ...args));
  },
  showWelcomeMessage: (func) => {
    ipcRenderer.on("SHOW_WELCOME_MESSAGE", (event, ...args) =>
      func(event, ...args)
    );
  },
  sendStartMonitorMessage: () => {
    ipcRenderer.send("START_MONITORING");
  },
  sendStopMonitorMessage: () => {
    ipcRenderer.send("STOP_MONITORING");
  },
  sendRegisterMessage: () => {
    ipcRenderer.on("REGISTER", (event, ...args) => func(event, ...args));
  },
  sendTestMessage: () => {
    ipcRenderer.send("TEST");
  },
  sendSubmitMessage: () => {
    ipcRenderer.on("SUBMIT", (event, ...args) => func(event, ...args));
  },
});
