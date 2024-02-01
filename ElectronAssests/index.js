require("dotenv").config();
const { app, BrowserWindow, ipcMain, contextBridge } = require("electron");
const Store = require("electron-store");
const store = new Store();

const { net } = require("electron");
const path = require("path");
const {
  getStaticCPUData,
  getDynamicCPUData,
  logDynamicCPUData,
  saveStaticCPUData,
  setApp,
} = require("./cpu");
const { getSystemInfo, saveSystemInfoToFile } = require("./system");
const {
  getStaticRAMData,
  saveStaticRAMData,
  getDynamicRAMData,
  logDynamicRAMData,
} = require("./ram");
const { getConnectedDevicesData } = require("./connectedDevices");
const { getDynamicNetworkData, logDynamicNetworkData } = require("./network");
const { getMemoryInfo, saveMemoryInfoToFile } = require("./memory");
const AuthProvider = require("./AuthProvider");
const { IPC_MESSAGES } = require("./constants");
const { protectedResources, msalConfig } = require("./authConfig");
const getGraphClient = require("./graph");
require("dotenv").config();

let mainWindow;
let authProvider;
let dataCache = [];
const clientId = store.get("AppId");
const secretKey = store.get("ClientSecret");

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false, // disable Node.js integration
      contextIsolation: true, // enable context isolation
      preload: path.join(__dirname, "preload.js"), // adjust the path as needed
    },
  });

  authProvider = new AuthProvider(msalConfig);

  mainWindow.loadFile("index.html");

  const cpuModule = require("./cpu");
  const networkModule = require("./network"); // Import network.js
  const ramModule = require("./ram");
  const connectedDevicesModule = require("./connectedDevices");
  cpuModule.setApp(app);
  ramModule.setApp(app);
  connectedDevicesModule.setApp(app);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

// IPC listener in the main process
ipcMain.on(IPC_MESSAGES.START_MONITORING, (event) => {
  // Send static CPU data to the renderer process
  const staticData = getStaticCPUData();
  event.sender.send("response-static-cpu-data", staticData);
  console.log("Monitoring started from main process");
});

ipcMain.handle("getStoreValue", (event, key) => {
  return store.get(key);
});

ipcMain.on("setStoreValue", (event, key, value) => {
  store.set(key, value);
});

ipcMain.on("request-static-ram-data", (event) => {
  // Send static RAM data to the renderer process
  const staticRAMData = getStaticRAMData();
  event.sender.send("response-static-ram-data", staticRAMData);
});

ipcMain.on("deleteStoreValue", (event, key) => {
  try {
    store.delete(key);
    event.returnValue = true; // Return success to the renderer process
  } catch (error) {
    console.error("Error deleting from store:", error);
    event.returnValue = false; // Return error to the renderer process
  }
});

//Event Handlers for Auth

ipcMain.on(IPC_MESSAGES.LOGIN, async () => {
  const account = await authProvider.login();
  await mainWindow.loadFile(path.join(__dirname, "./index.html"));
  mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
});

ipcMain.on(IPC_MESSAGES.LOGOUT, async () => {
  await authProvider.logout();

  await mainWindow.loadFile(path.join(__dirname, "./index.html"));
});

ipcMain.on(IPC_MESSAGES.GET_PROFILE, async () => {
  const tokenRequest = {
    scopes: protectedResources.graphMe.scopes,
  };

  const tokenResponse = await authProvider.getToken(tokenRequest);
  const account = authProvider.account;

  await mainWindow.loadFile(path.join(__dirname, "./index.html"));

  const graphResponse = await getGraphClient(tokenResponse.accessToken)
    .api(protectedResources.graphMe.endpoint)
    .get();

  mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
  mainWindow.webContents.send(IPC_MESSAGES.SET_PROFILE, graphResponse);
});

ipcMain.on(IPC_MESSAGES.REGISTER, async () => {
  await mainWindow.loadFile(path.join(__dirname, "./register.html"));

  mainWindow.webContents.send(
    IPC_MESSAGES.REGISTER,
    "registered from index.js line161"
  );
});

ipcMain.on(IPC_MESSAGES.START_MONITORING, async () => {
  // Monitor CPU data every 10 seconds
  intervalId = setInterval(async () => {
    try {
      const dynamicData = await getDynamicCPUData();
      logDynamicCPUData(dynamicData);
      const staticData = await getStaticCPUData();
      saveStaticCPUData(staticData);

      const dynamicNetworkData = await getDynamicNetworkData();
      logDynamicNetworkData(dynamicNetworkData);

      const staticRAMData = await getStaticRAMData();
      const dynamicRAMData = await getDynamicRAMData();
      const memoryInfo = await getMemoryInfo();
      const systemInfo = await getSystemInfo();
      logDynamicRAMData(dynamicRAMData);
      saveStaticRAMData(staticRAMData);

      saveSystemInfoToFile();
      saveMemoryInfoToFile();

      const connectedDevicesData = await getConnectedDevicesData();

      dataCache.push({
        CPUdata: dynamicData,
        NetworkData: dynamicNetworkData,
        RAMData: dynamicRAMData,
        CDData: connectedDevicesData,
        CPUstaticData: staticData,
        RAMstaticData: staticRAMData,
        MemoryInfo: memoryInfo,
        SystemInfo: systemInfo,
        timestamp: new Date(),
      });

      if (dataCache.length >= 4) {
        const body = JSON.stringify({
          dataCache,
          secretKey,
          clientId,
        });

        fetch("http://localhost:5000/endpointMetrics/GetEndpointMetrics", {
          // replace with your URL
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            dataCache = [];
          })
          .catch((error) => console.error("Error:", error));
      }

      console.log(dataCache);
      console.log(dataCache.length);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

      mainWindow.webContents.send("update-cpu-data", dynamicData);
      mainWindow.webContents.send("update-ram-data", dynamicRAMData);
      mainWindow.webContents.send("update-CD-data", connectedDevicesData);

      app.isRunningFirstTime = false;
    } catch (error) {
      console.error("Error:", error);
    }
  }, 10000);
});

ipcMain.on(IPC_MESSAGES.STOP_MONITORING, async () => {
  if (intervalId) {
    console.log("Monitoring stopped from main process");
    clearInterval(intervalId);
    intervalId = null;
  }
});

ipcMain.on("TEST", async () => {
  await mainWindow.loadFile(path.join(__dirname, "./register.html"));
  console.log("test from index.js line161");
  try {
    const data = fetch("https://jsonplaceholder.typicode.com/todos/1")
      .then((response) => response.json())
      .then((json) => console.log(json));

    // mainWindow.webContents.send(IPC_MESSAGES.TEST, data, "test from index.js line161");
  } catch (error) {
    console.log(error, "ERR");
  }
});

ipcMain.on("SUBMIT", async (param) => {
  // await mainWindow.loadFile(path.join(__dirname, "./register.html"));
  console.log("submit from index.js ");
  try {
    const data = fetch("https://jsonplaceholder.typicode.com/todos/1")
      .then((response) => response.json())
      .then((json) => console.log(json, "dfdf", param));

    // mainWindow.webContents.send(IPC_MESSAGES.TEST, data, "test from index.js line161");
  } catch (error) {
    console.log(error, "ERRor");
  }
});
