// const { net } = require("electron/main");

const welcomeDiv = document.getElementById('WelcomeMessage');
const signInButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const seeProfileButton = document.getElementById('seeProfile');
const startBtn = document.getElementById('startMonitor');
const stopBtn = document.getElementById('stopMonitor');
const cardDiv = document.getElementById('cardDiv');
const sCardDiv = document.getElementById('secondCardDiv');
const regBtn = document.getElementById('register');
const profileDiv = document.getElementById('profileDiv');
const test = document.getElementById('testBtn');
const textBox = document.getElementById('textBox');
const submitBtn = document.getElementById('submitBtn');
const backBtn = document.getElementById('back');

window.renderer.showWelcomeMessage((event, account) => {
    if (!account) return;

    cardDiv.style.display = 'initial';
    sCardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${account.name}`;
    signInButton.hidden = true;
    signOutButton.hidden = false;
});

window.renderer.handleProfileData((event, graphResponse) => {
    if (!graphResponse) return;

    console.log(`Graph API responded at: ${new Date().toString()}`, graphResponse);
    setProfile(graphResponse);
});

// window.renderer.sendTestMessage(() => {
//     test.style.display = 'hidden';
// })

window.renderer.sendRegisterMessage((event, account) => {
    if (!account) return;
    console.log(account);

    cardDiv.style.display = 'initial';
    sCardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${account.name} to Register`;
    signInButton.hidden = true;
    signOutButton.hidden = false;
});

// UI event handlers
signInButton.addEventListener('click', () => {
    window.renderer.sendLoginMessage();
});

signOutButton.addEventListener('click', () => {
    window.renderer.sendSignoutMessage();
});

seeProfileButton.addEventListener('click', () => {
    window.renderer.sendSeeProfileMessage();
});

regBtn.addEventListener('click', () => {
    window.renderer.sendRegisterMessage();
});

startBtn.addEventListener('click', () => {
    console.log('Monitoring...');
    window.renderer.sendStartMonitorMessage();
});

stopBtn.addEventListener('click', () => {
    console.log('Stopped!');
    window.renderer.sendStopMonitorMessage();
});

regBtn.addEventListener('click', () => {
    window.renderer.sendTestMessage();
    test.style.display = 'hidden';
    signInButton.hidden = 'true';
    backBtn.hidden = 'false';
    console.log(signInButton);
});
if(submitBtn){

    submitBtn.addEventListener('click', () => {
        console.log(textBox.value);
        // window.renderer.sendSubmitMessage(textBox.value);
    let body = JSON.stringify({ msg: textBox.value });
    fetch('https://dummyjson.com/posts/add', {
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: textBox.value,
            userId: 5,
            /* other post data */
        })
    })
    .then(response => response.json()) // assuming the server responds with JSON
    .then(data => console.log(data))
    .catch((error) => console.error('Error:', error));
    
});
}



const setProfile = (data) => {
    if (!data) return;

    profileDiv.innerHTML = '';

    const title = document.createElement('p');
    const email = document.createElement('p');
    const phone = document.createElement('p');
    const address = document.createElement('p');

    title.innerHTML = '<strong>Title: </strong>' + data.jobTitle;
    email.innerHTML = '<strong>Mail: </strong>' + data.mail;
    phone.innerHTML = '<strong>Phone: </strong>' + data.businessPhones[0];
    address.innerHTML = '<strong>Location: </strong>' + data.officeLocation;

    profileDiv.appendChild(title);
    profileDiv.appendChild(email);
    profileDiv.appendChild(phone);
    profileDiv.appendChild(address);
}