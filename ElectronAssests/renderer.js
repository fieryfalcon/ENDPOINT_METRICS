// const { net } = require("electron/main");


const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("signIn");
const signOutButton = document.getElementById("signOut");
const seeProfileButton = document.getElementById("seeProfile");
const startBtn = document.getElementById("startMonitor");
const stopBtn = document.getElementById("stopMonitor");
const cardDiv = document.getElementById("cardDiv");
const sCardDiv = document.getElementById("secondCardDiv");
const regBtn = document.getElementById("register");
const profileDiv = document.getElementById("profileDiv");
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
  const clientSecret = await window.api.invoke("getStoreValue", "ClientSecret");
  console.log(clientSecret);
  return clientSecret;
}

async function getAppId() {
  const appId = await window.api.invoke("getStoreValue", "AppId");
  console.log(appId);
  return appId;
}

window.renderer.showWelcomeMessage((event, account) => {
  if (!account) return;

  cardDiv.style.display = "initial";
  sCardDiv.style.display = "initial";
  welcomeDiv.innerHTML = `Welcome ${account.name}!`;
  signInButton.hidden = true;
  signOutButton.hidden = false;
});

window.renderer.updateCPU((event, cpuData) => {
  if (!cpuData) {console.log("nodata ")};

  console.log("CPU Data: ", cpuData);
});

window.renderer.handleProfileData((event, graphResponse) => {
  if (!graphResponse) return;

  console.log(
    `Graph API responded at: ${new Date().toString()}`,
    graphResponse
  );
  setProfile(graphResponse);
});



// window.renderer.sendTestMessage(() => {
//     test.style.display = 'hidden';
// })

window.renderer.sendRegisterMessage((event, account) => {
  if (!account) return;
  // console.log(account);

  cardDiv.style.display = "initial";
  sCardDiv.style.display = "initial";
  welcomeDiv.innerHTML = `Welcome ${account.name} to Register`;
  signInButton.hidden = true;
  signOutButton.hidden = false;
});

// UI event handlers
signInButton.addEventListener("click", () => {
  window.renderer.sendLoginMessage();
});

signOutButton.addEventListener("click", () => {
  window.renderer.sendSignoutMessage();
});

seeProfileButton.addEventListener("click", () => {
  window.renderer.sendSeeProfileMessage();
});

regBtn.addEventListener("click", () => {
  window.renderer.sendRegisterMessage();
});

startBtn.addEventListener("click", () => {
  console.log("Monitoring...");
  window.renderer.sendStartMonitorMessage();
});

stopBtn.addEventListener("click", () => {
  console.log("Stopped!");
  window.renderer.sendStopMonitorMessage();
});

regBtn.addEventListener("click", () => {
  window.renderer.sendTestMessage();
  test.style.display = "hidden";
  signInButton.hidden = "true";
  backBtn.hidden = "false";
  // console.log(signInButton);
});
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    const userPrincipalName = await getUserName();
    const MStoken = await getToken();

    // Construct the URL with query parameters
    const apiUrl = new URL("http://localhost:5000/endpointMetrics/Register");
    apiUrl.searchParams.append("userPrincipalName", userPrincipalName);
    apiUrl.searchParams.append("MStoken", MStoken);

    // Make the GET request
    fetch(apiUrl)
      .then((response) => {
        console.log("Request success: ", response);

        if (response.ok) {
          // Check if the response contains appId and clientSecret
          return response.json();
        } else {
          console.error("Request failed with status:", response.status);
        }
      })
      .then((data) => {
        console.log("Response data:", data);

        if (data && data.Data && data.Data.appId && data.Data.clientSecret) {
          // Store the appId and clientSecret in the Electron store
          setAppId(data.Data.appId);
          setClientSecret(data.Data.clientSecret);

          // Now, you can access these values later in your Electron app
          const storedAppId = getAppId();
          const storedClientSecret = getClientSecret();

          console.log("Stored appId:", storedAppId);
          console.log("Stored clientSecret:", storedClientSecret);

          electronStore.delete("token");
        } else {
          console.error(
            "Response data does not contain appId and clientSecret"
          );
        }
      })
      .catch((error) => console.error("Error:", error));
  });
}

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
