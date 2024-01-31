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

module.exports = {
  getCpuData,
  getSystemData,
  getMemoryData,
};
