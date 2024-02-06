const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const si = require("systeminformation");
const fs = require("fs");
const path = require("path");

let app;
require("dotenv").config({ path: "../.env" });

const token = process.env.INFLUX_TOKEN;
const url = process.env.INFLUX_URL;
const org = process.env.INFLUX_ORG;
const bucket = `CPU_LOGS`;

const client = new InfluxDB({ url, token });

const writeClient = client.getWriteApi(org, bucket, "ns");

function setApp(electronApp) {
  app = electronApp;
}

async function getStaticCPUData() {
  const data = await si.cpu();
  return {
    manufacturer: data.manufacturer,
    brand: data.brand,
    vendor: data.vendor,
    family: data.family,
    model: data.model,
    speed: data.speed,
    speedMin: data.speedMin,
    speedMax: data.speedMax,
    cores: data.cores,
    physicalCores: data.physicalCores,
    processors: data.processors,
  };
}

async function getDynamicCPUData() {
  const currentLoad = await si.currentLoad();
  const processes = await si.processes();
  const cpuTemperature = await si.cpuTemperature();

  return {
    avgLoad: currentLoad.avgLoad,
    currentLoad: currentLoad.currentLoad,
    currentLoadUser: currentLoad.currentLoadUser,
    currentLoadSystem: currentLoad.currentLoadSystem,
    currentLoadNice: currentLoad.currentLoadNice,
    currentLoadIdle: currentLoad.currentLoadIdle,
    currentLoadIrq: currentLoad.currentLoadIrq,
    totalProcesses: processes.all,
    cpuTemperature: cpuTemperature.main,
  };
}

function logDynamicCPUData(dynamicData) {
  const point = new Point("cpu_data")
    // .floatField("avgLoad", dynamicData.avgLoad)
    .floatField("currentLoad", dynamicData.currentLoad)
    .floatField("currentLoadUser", dynamicData.currentLoadUser)
    .floatField("currentLoadSystem", dynamicData.currentLoadSystem)
    .floatField("currentLoadNice", dynamicData.currentLoadNice)
    .floatField("currentLoadIdle", dynamicData.currentLoadIdle)
    .floatField("currentLoadIrq", dynamicData.currentLoadIrq)
    .intField("totalProcesses", dynamicData.totalProcesses)
    .tag(
      "cpuTemperature",
      dynamicData.cpuTemperature === null ? "null" : "value"
    )
    .floatField(
      "cpuTemperature",
      dynamicData.cpuTemperature === null ? 0.0 : dynamicData.cpuTemperature
    );

  writeClient.writePoint(point);
  writeClient.flush();
}

function saveStaticCPUData(staticData) {
  const appPath = app.getAppPath();
  const dataPath = path.join(appPath, "cpu.json");
  const selectedFields = {
    manufacturer: staticData.manufacturer,
    brand: staticData.brand,
    vendor: staticData.vendor,
    family: staticData.family,
    model: staticData.model,
    speed: staticData.speed,
    speedMin: staticData.speedMin,
    speedMax: staticData.speedMax,
    cores: staticData.cores,
    physicalCores: staticData.physicalCores,
    processors: staticData.processors,
  };
  // console.log("Saving static CPU data to:", dataPath);

  fs.writeFileSync(dataPath, JSON.stringify(selectedFields, null, 2), "utf-8");
}

module.exports = {
  getStaticCPUData,
  getDynamicCPUData,
  logDynamicCPUData,
  saveStaticCPUData,
  setApp,
};
