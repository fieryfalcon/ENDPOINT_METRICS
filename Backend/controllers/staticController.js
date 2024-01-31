const fs = require("fs");
const path = require("path");

// Read the 'cpu.json' file for static data
const cpuDataPath = path.join(__dirname, "../../ElectronAssests/cpu.json");
let staticCPUData = {};
const systemDataPath = path.join(
  __dirname,
  "../../ElectronAssests/system.json"
);
let staticSystemData = {};
const memoryDataPath = path.join(
  __dirname,
  "../../ElectronAssests/memory.json"
);
let staticMemoryData = {};

try {
  staticCPUData = JSON.parse(fs.readFileSync(cpuDataPath, "utf-8"));
  staticSystemData = JSON.parse(fs.readFileSync(systemDataPath, "utf-8"));
  staticMemoryData = JSON.parse(fs.readFileSync(memoryDataPath, "utf-8"));
} catch (error) {
  console.error("Error reading static CPU data:", error);
}

// Read the 'ram.json' file for static data
const ramDataPath = path.join(__dirname, "../../ElectronAssests/ram.json");
let staticRAMData = {};

try {
  staticRAMData = JSON.parse(fs.readFileSync(ramDataPath, "utf-8"));
} catch (error) {
  console.error("Error reading static RAM data:", error);
}

// Read the 'devices.json' file for static data
const devicesDataPath = path.join(
  __dirname,
  "../../ElectronAssests/devices.json"
);
let staticDevicesData = {};

try {
  staticDevicesData = JSON.parse(fs.readFileSync(devicesDataPath, "utf-8"));
} catch (error) {
  console.error("Error reading static Devices data:", error);
}

// Function to get static CPU data
function getCpuData(req, res) {
  res.json(staticCPUData);
}

function getSystemData(req, res) {
  res.json(staticSystemData);
}

function getMemoryData(req, res) {
  res.json(staticMemoryData);
}

// Function to get static RAM data
function getRamData(req, res) {
  res.json(staticRAMData);
}

// Function to get static Devices data
function getDevicesData(req, res) {
  res.json(staticDevicesData);
}

module.exports = {
  getCpuData,
  getSystemData,
  getMemoryData,
  getRamData,
  getDevicesData,
};
