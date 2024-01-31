const express = require("express");
const router = express.Router();
const dynamicController = require("../controllers/dynamicController");

// Route to get dynamic CPU data
router.get("/cpu-data", dynamicController.getCpuData);
router.get("/network-data", dynamicController.getNetworkData);

module.exports = router;
