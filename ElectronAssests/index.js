require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  getStaticCPUData,
  getDynamicCPUData,
  logDynamicCPUData,
  saveStaticCPUData,
  setApp,
} = require("./cpu");
const { getStaticRAMData, saveStaticRAMData, getDynamicRAMData, logDynamicRAMData } = require("./ram");
const {getConnectedDevicesData} = require("./connectedDevices");
const { getDynamicNetworkData, logDynamicNetworkData } = require("./network");
const AuthProvider = require("./AuthProvider");
const { IPC_MESSAGES } = require("./constants");
const { protectedResources, msalConfig } = require("./authConfig");
const getGraphClient = require("./graph");
require("dotenv").config();


let mainWindow;
let authProvider;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
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

  // Monitor CPU data every 10 seconds
  setInterval(async () => {
    try {
      // Get dynamic CPU data
      const dynamicData = await getDynamicCPUData();
      console.log(dynamicData);
      // Log dynamic data to InfluxDB via cpu.js
      logDynamicCPUData(dynamicData);

      // Get static CPU data (only on app start)
      if (!app.isRunningFirstTime) return;
      const staticData = await getStaticCPUData();
      console.log(staticData);

      // Save static data to cpu.json
      saveStaticCPUData(staticData);

      // Get static RAM data (only on app start)
      // if (!app.isRunningFirstTime) return;
      const staticRAMData = await getStaticRAMData();
      // console.log(staticRAMData, "static ram data");

      saveStaticRAMData(staticRAMData);

      // if(!app.isRunningFirstTime) return;
      const connectedDevicesData =  getConnectedDevicesData();
      console.log(connectedDevicesData, "connected devices data");
      // Get dynamic RAM data
      const dynamicRAMData = await getDynamicRAMData();
      console.log(dynamicRAMData, "dynamic ram data");
      logDynamicRAMData(dynamicRAMData);

      // Send dynamic data to the renderer process
      mainWindow.webContents.send("update-cpu-data", dynamicData);
      mainWindow.webContents.send("update-ram-data", dynamicRAMData);
      mainWindow.webContents.send("update-CD-data", connectedDevicesData);

      app.isRunningFirstTime = false;
    } catch (error) {
      console.error("Error:", error);
    }
  }, 15000);

  // Commented for now
  // Monitor Network data every 1 second
  // setInterval(async () => {
  // try {
  // // Get dynamic Network data
  // const dynamicNetworkData = await getDynamicNetworkData();
  // // console.log(dynamicNetworkData);
  // // Log dynamic Network data to InfluxDB via network.js
  // logDynamicNetworkData(dynamicNetworkData);
  // } catch (error) {
  // console.error("Error:", error);
  // }
  // }, 1000);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

// IPC listener in the main process
ipcMain.on("request-static-cpu-data", (event) => {
  // Send static CPU data to the renderer process
  const staticData = getStaticCPUData();
  event.sender.send("response-static-cpu-data", staticData);
});

ipcMain.on("request-static-ram-data", (event) => {
  // Send static RAM data to the renderer process
  const staticRAMData = getStaticRAMData();
  event.sender.send("response-static-ram-data", staticRAMData);
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