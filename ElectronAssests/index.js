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
const { getSystemInfo, saveSystemInfoToFile } = require("./system");
const { getDynamicNetworkData, logDynamicNetworkData } = require("./network");
const { getMemoryInfo, saveMemoryInfoToFile } = require("./memory");
require("dotenv").config();
console.log("InfluxDB URL:", process.env.INFLUX_URL); // Add this line to check the variable
// Import network.js

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("index.html");

  const cpuModule = require("./cpu");
  const networkModule = require("./network"); // Import network.js
  cpuModule.setApp(app);

  // Monitor CPU data every 10 seconds
  setInterval(async () => {
    try {
      // Get dynamic CPU data
      const dynamicData = await getDynamicCPUData();
      console.log(dynamicData);
      // Log dynamic data to InfluxDB via cpu.js
      logDynamicCPUData(dynamicData);

      if (!app.isRunningFirstTime) return;
      getSystemInfo().then((systemInfo) => {
        if (systemInfo !== null) {
          console.log("System Information:", systemInfo);
        }
      });

      saveSystemInfoToFile();

      const staticData = await getStaticCPUData();
      console.log(staticData);
      saveStaticCPUData(staticData);

      // Send dynamic data to the renderer process
      mainWindow.webContents.send("update-cpu-data", dynamicData);

      app.isRunningFirstTime = false;
    } catch (error) {
      console.error("Error:", error);
    }
  }, 10000);

  setInterval(async () => {
    try {
      getMemoryInfo().then((memoryInfo) => {
        if (memoryInfo !== null) {
          console.log("MemoryInfo", memoryInfo);
        }
      });
      saveMemoryInfoToFile();
    } catch (error) {
      console.error("Error:", error);
    }
  }, 1000000);

  // Monitor Network data every 1 second
  setInterval(async () => {
    try {
      // Get dynamic Network data
      const dynamicNetworkData = await getDynamicNetworkData();
      console.log(dynamicNetworkData);
      // Log dynamic Network data to InfluxDB via network.js
      logDynamicNetworkData(dynamicNetworkData);
    } catch (error) {
      console.error("Error:", error);
    }
  }, 5000);

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
