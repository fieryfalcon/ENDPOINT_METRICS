const si = require("systeminformation");
const fs = require("fs");

async function getMemoryInfo() {
  try {
    const memoryInfo = await si.mem();
    return memoryInfo;
  } catch (error) {
    console.error("Error getting memory information:", error);
    return null;
  }
}

async function saveMemoryInfoToFile() {
  try {
    const memoryInfo = await getMemoryInfo();
    if (memoryInfo) {
      const dataPath = "memory.json";
      fs.writeFileSync(dataPath, JSON.stringify(memoryInfo, null, 2), "utf-8");
      console.log("Memory information saved to memory.json");
    }
  } catch (error) {
    console.error("Error saving memory information:", error);
  }
}

module.exports = {
  getMemoryInfo,
  saveMemoryInfoToFile,
};
