const fs = require("fs");
const path = require("path");

// Read the 'cpu.json' file for static data
const cpuDataPath = path.join(__dirname, "../../ElectronAssests/cpu.json");
let staticCPUData = {};

try {
  staticCPUData = JSON.parse(fs.readFileSync(cpuDataPath, "utf-8"));
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

// Function to get static CPU data
function getCpuData(req, res) {
  res.json(staticCPUData);
}

// Function to get static RAM data
function getRamData(req, res) {
  res.json(staticRAMData);
}

module.exports = {
  getCpuData,
  getRamData,
};
