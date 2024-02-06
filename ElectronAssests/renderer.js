// const { net } = require("electron/main");

const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("signIn");
const signOutButton = document.getElementById("signOut");
const startBtn = document.getElementById("startMonitor");
const stopBtn = document.getElementById("stopMonitor");
const cardDiv = document.getElementById("cardDiv");

const regBtn = document.getElementById("register");
const profileDiv = document.getElementById("profileDiv");
const getCPUData = document.getElementById("getCPUData");
const test = document.getElementById("testBtn");
const textBox = document.getElementById("textBox");
const submitBtn = document.getElementById("submitBtn");
const backBtn = document.getElementById("back");
// const { ipcRenderer } = require("electron");

async function getToken() {
  const token = await window.api.invoke("getStoreValue", "token");
  // console.log(token);
  return token;
}
async function getUserName() {
  const userName = await window.api.invoke("getStoreValue", "account-id");
  // console.log(userName);
  return userName;
}

async function gettenantid() {
  const tenantid = await window.api.invoke("getStoreValue", "tenant-id");
  console.log(tenantid);
  return tenantid;
}

async function setClientSecret(token) {
  await window.electronStore.set("ClientSecret", token);
}

async function setAppId(token) {
  await window.electronStore.set("AppId", token);
}

async function getClientSecret() {
  try {
    const clientSecret = await window.api.invoke(
      "getStoreValue",
      "clientSecret"
    );
    console.log("ClientSecret:", clientSecret);
    return clientSecret;
  } catch (error) {
    console.error("Error fetching clientSecret:", error);
    // Handle the error appropriately
  }
}

async function getAppId() {
  try {
    const appId = await window.api.invoke("getStoreValue", "appId");
    console.log("AppId:", appId);
    return appId;
  } catch (error) {
    console.error("Error fetching appId:", error);
    // Handle the error appropriately
  }
}

async function sendRequestToWebsite() {
  try {
    const appId = await getAppId();
    const clientSecret = await getClientSecret();
    const url = "http://localhost:5000/endpointMetrics/status";
    const queryParams = new URLSearchParams({
      appId: appId,
      clientSecret: clientSecret,
    });

    const fullUrl = `${url}?${queryParams.toString()}`;

    const response = await fetch(fullUrl);
    if (response.ok) {
      document.getElementById("getCPUData").textContent =
        "Connection to PSA Established";
      return true;
    } else {
      console.error("Request to website failed");
      document.getElementById("getCPUData").textContent =
        "Failed to connect to PSA ... Trying Again in 60 seconds";
      return false;
    }
  } catch (error) {
    console.error("Error sending request to website:", error);
  }
}

const interval = 60 * 1000;

async function sendRequestPeriodically() {
  sendRequestToWebsite();
  setInterval(sendRequestToWebsite, interval);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const storedAppId = await getAppId();
    const storedClientSecret = await getClientSecret();
    const account = await getUserName();

    console.log("Stored appId:", storedAppId);
    console.log("Stored clientSecret:", storedClientSecret);

    if (storedAppId && storedClientSecret) {
      window.renderer.sendTestMessage();
      console.log("Stored appId and clientSecret found");
      signInButton.hidden = true;
      signOutButton.hidden = false;
      stopBtn.hidden = false;
      sendRequestPeriodically();
      profileDiv.innerHTML = `${account}`;
    } else {
      signInButton.hidden = false;
      signOutButton.hidden = true;
      stopBtn.hidden = true;
      profileDiv.innerHTML = "Please sign in to continue";
      getCPUData.innerHTML = "";
    }
  } catch (error) {
    console.error("Error in DOMContentLoaded:", error);
  }
});

window.renderer.showWelcomeMessage((event, account) => {
  if (!account) return;

  signInButton.hidden = true;
  signOutButton.hidden = false;
  stopBtn.hidden = false;
  sendRequestPeriodically();
  profileDiv.innerHTML = `${account.name}`;
});

window.renderer.updateCPU((event, cpuData) => {
  if (!cpuData) {
    console.log("nodata ");
  }
});

window.renderer.handleProfileData((event, graphResponse) => {
  if (!graphResponse) return;

  console.log(
    `Graph API responded at: ${new Date().toString()}`,
    graphResponse
  );
  setProfile(graphResponse);
});

signInButton.addEventListener("click", async () => {
  window.renderer.sendLoginMessage();

  console.log("Sign in clicked");
  const user = await getUserName();
  const token = await getToken();

  console.log("User:", user);
  console.log("Token:", token);
});

signOutButton.addEventListener("click", () => {
  window.renderer.sendSignoutMessage();
});

stopBtn.addEventListener("click", async () => {
  console.log("Stopped!");
  window.renderer.sendStopMonitorMessage();

  const user = await getUserName();
  const token = await getToken();

  console.log("User:", user);
  console.log("Token:", token);
});

const setProfile = (data) => {
  if (!data) return;

  profileDiv.innerHTML = "";

  const title = document.createElement("p");
  const email = document.createElement("p");
  const phone = document.createElement("p");
  const address = document.createElement("p");

  title.innerHTML = "<strong>Title: </strong>" + data.jobTitle;
  email.innerHTML = "<strong>Mail: </strong>" + data.mail;
  phone.innerHTML = "<strong>Phone: </strong>" + data.businessPhones[0];
  address.innerHTML = "<strong>Location: </strong>" + data.officeLocation;

  profileDiv.appendChild(title);
  profileDiv.appendChild(email);
  profileDiv.appendChild(phone);
  profileDiv.appendChild(address);
};
