const {InfluxDB, Point} = require('@influxdata/influxdb-client')
const si = require('systeminformation')
const fs = require('fs')
const path = require('path')

let app;
require('dotenv').config({path: '../.env'})

const token = process.env.INFLUX_TOKEN;
const url = process.env.INFLUX_URL;
const org = process.env.INFLUX_ORG;
const bucket = `DEVICE_LOGS`;

const client = new InfluxDB({url, token});
const writeClient = client.getWriteApi(org, bucket, "ns");

function setApp(electronApp) {
    app = electronApp;
}

//Get Connected Devices Data
async function getConnectedDevicesData() {
    try {
        const audioDevices = await si.audio();
        const bluetoothDevices = await si.bluetoothDevices();
        const connectedBTDevices = bluetoothDevices.filter(device => device.connected === 'true')
        const usbDevices = await si.usb();
        const data = {
            audioDevices,
            connectedBTDevices,
            usbDevices,
        };
        // For saving data to a file devices.json    
    const appPath = app.getAppPath();
    const filePath = path.join(appPath, 'devices.json');
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Connected Devices data saved to:', filePath);
    return data;
} catch (error) {
    console.log('Error saving Connected Devices data:', error);
}

}


module.exports = {
    getConnectedDevicesData,
    setApp,
}