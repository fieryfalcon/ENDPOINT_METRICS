const { InfluxDB, FluxResultObserver } = require("@influxdata/influxdb-client");

// Configure InfluxDB connection
require("dotenv").config({ path: "../.env" });

const token = process.env.INFLUX_TOKEN;
const url = process.env.INFLUX_URL;
const org = process.env.INFLUX_ORG;

const client = new InfluxDB({ url, token });

async function getCPUQueryData() {
  let queryClient = client.getQueryApi(org);
  let fluxQuery = `from(bucket: "CPU_LOGS")
 |> range(start: -1m)`;
  return new Promise((resolve, reject) => {
    const result = [];
    queryClient.queryRows(fluxQuery, {
      next: (row, tableMeta) => {
        const tableObject = tableMeta.toObject(row);
        result.push(tableObject);
      },
      error: (error) => {
        console.error("\nError", error);
        reject(error);
      },
      complete: () => {
        resolve(result);
      },
    });
  });
}

async function getNetworkQueryData() {
  let queryClient = client.getQueryApi(org);
  let fluxQuery = `from(bucket: "NETWORK_LOGS")
|> range(start: -20s)`;
  return new Promise((resolve, reject) => {
    const result = [];
    queryClient.queryRows(fluxQuery, {
      next: (row, tableMeta) => {
        const tableObject = tableMeta.toObject(row);
        result.push(tableObject);
      },
      error: (error) => {
        console.error("\nError", error);
        reject(error);
      },
      complete: () => {
        resolve(result);
      },
    });
  });
}

// Function to get dynamic CPU data from InfluxDB
async function getCpuData(req, res) {
  try {
    const data = await getCPUQueryData();
    res.json({ data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

async function getNetworkData(req, res) {
  try {
    const data = await getNetworkQueryData();
    res.json({ data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

module.exports = {
  getCpuData,
  getNetworkData,
};
