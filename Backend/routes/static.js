const express = require("express");
const router = express.Router();
const staticController = require("../controllers/staticController");

// Route to get static CPU data
router.get("/cpu-data", staticController.getCpuData);
router.get("/system-data", staticController.getSystemData);
router.get("/memory-data", staticController.getMemoryData);

module.exports = router;
