require("dotenv").config();
const {
  app,
  BrowserWindow,
  ipcMain,
  contextBridge,
  ipcRenderer,
} = require("electron");
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

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false, // disable Node.js integration
      contextIsolation: true, // enable context isolation
      preload: path.join(__dirname, "preload.js"), // adjust the path as needed
    },
  });

  authProvider = new AuthProvider(msalConfig);
  const clientId = store.get("appId");
  const secretKey = store.get("clientSecret");
  const Tenant_id = store.get("tenant-id");
  console.log(clientId, secretKey, Tenant_id, "clientId, secretKey, Tenant_id");
  mainWindow.loadFile("index.html");

  const cpuModule = require("./cpu");
  const networkModule = require("./network");
  const ramModule = require("./ram");
  const connectedDevicesModule = require("./connectedDevices");
  cpuModule.setApp(app);
  ramModule.setApp(app);
  connectedDevicesModule.setApp(app);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

ipcMain.handle("getStoreValue", (event, key) => {
  return store.get(key);
});

ipcMain.on("setStoreValue", (event, key, value) => {
  store.set(key, value);
});

ipcMain.on(IPC_MESSAGES.LOGIN, async () => {
  const account = await authProvider.login();
  const clientId = await store.get("appId");
  const secretKey = await store.get("clientSecret");
  const Tenant_id = await store.get("tenant-id");

  // await mainWindow.loadFile(path.join(__dirname, "./index.html"));
  mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);

  console.log("AppId and ClientSecret found");
  intervalId = setInterval(async () => {
    try {
      const dynamicData = await getDynamicCPUData();
      // logDynamicCPUData(dynamicData);
      const staticData = await getStaticCPUData();
      saveStaticCPUData(staticData);

      const dynamicNetworkData = await getDynamicNetworkData();
      // logDynamicNetworkData(dynamicNetworkData);

      const staticRAMData = await getStaticRAMData();
      const dynamicRAMData = await getDynamicRAMData();
      const memoryInfo = await getMemoryInfo();
      const systemInfo = await getSystemInfo();
      // logDynamicRAMData(dynamicRAMData);
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
          Tenant_id,
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

ipcMain.on("SKIP_LOGIN", async () => {
  const clientId = await store.get("appId");
  const secretKey = await store.get("clientSecret");
  const Tenant_id = await store.get("tenant-id");

  if (clientId && secretKey) {
    console.log("AppId and ClientSecret found");
    intervalId = setInterval(async () => {
      try {
        console.log("Interval called");
        const dynamicData = await getDynamicCPUData();
        // logDynamicCPUData(dynamicData);
        const staticData = await getStaticCPUData();
        saveStaticCPUData(staticData);

        const dynamicNetworkData = await getDynamicNetworkData();
        // logDynamicNetworkData(dynamicNetworkData);

        const staticRAMData = await getStaticRAMData();
        const dynamicRAMData = await getDynamicRAMData();
        const memoryInfo = await getMemoryInfo();
        const systemInfo = await getSystemInfo();
        // logDynamicRAMData(dynamicRAMData);
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
            Tenant_id,
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
              dataCache = [];
            })
            .catch((error) => console.error("Error:", error));
        }

        console.log(dataCache.length);
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

        app.isRunningFirstTime = false;
      } catch (error) {
        console.error("Error:", error);
      }
    }, 10000);
  } else {
    console.log("AppId and ClientSecret not found");
  }
});

ipcMain.on(IPC_MESSAGES.LOGOUT, async () => {
  await authProvider.logout();
  store.clear();
  await mainWindow.loadFile(path.join(__dirname, "./index.html"));
});

ipcMain.on(IPC_MESSAGES.STOP_MONITORING, async () => {
  if (intervalId) {
    console.log("Monitoring will soon be stopped");
    clearInterval(intervalId);
    intervalId = null;
  }
});

ipcMain.on("auth-code-received", async (event, code) => {
  const tokenRequest = {
    code: code,
    scopes: protectedResources.graphMe.scopes || [],
    redirectUri: "https://graph.microsoft.com/v1.0/me",
  };
  console.log("kubjk");
  try {
    const response = await AuthProvider.getToken(tokenRequest);
    onLogin(response.account, "login more line261");
  } catch (error) {
    console.error("Error:", error);
  }
});
