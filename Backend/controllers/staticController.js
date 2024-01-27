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

// Function to get static CPU data
function getCpuData(req, res) {
  res.json(staticCPUData);
}

module.exports = {
  getCpuData,
};
