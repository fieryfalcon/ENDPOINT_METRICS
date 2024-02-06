const {
  PublicClientApplication,
  InteractionRequiredAuthError,
} = require("@azure/msal-node");
const { shell, safeStorage } = require("electron");
const Store = require("electron-store");
const store = new Store();

let newPCA;
class AuthProvider {
  msalConfig;
  clientApplication;
  account;
  cache;
  constructor(msalConfig) {
    /**
     * Initialize a public client application. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
     */
    this.msalConfig = msalConfig;
    this.clientApplication = new PublicClientApplication(this.msalConfig);
    newPCA = this.clientApplication;
    this.cache = this.clientApplication.getTokenCache();
    this.account = null;
  }

  async login() {
    const authResponse = await this.getToken({
      scopes: [],
    });

    store.set("token", authResponse.accessToken);
    store.set("tenant-id", authResponse.tenantId);
    store.set("account-id", authResponse.account.username);

    console.log(authResponse.accessToken);

    const apiUrl = new URL("http://localhost:5000/endpointMetrics/Register");
    apiUrl.searchParams.append(
      "userPrincipalName",
      authResponse.account.username
    );
    apiUrl.searchParams.append("MStoken", authResponse.accessToken);
    apiUrl.searchParams.append("tenantid", authResponse.tenantId);

    fetch(apiUrl)
      .then((response) => {
        console.log("Request : ", response);

        if (response.ok) {
          return response.json();
        } else {
          console.error("Request failed with status:", response.status);
        }
      })
      .then((data) => {
        console.log("Response data:", data);

        if (data && data.Data && data.Data.appId && data.Data.clientSecret) {
          // Store the appId and clientSecret in the Electron store
          store.set("appId", data.Data.appId);
          store.set("clientSecret", data.Data.clientSecret);

          const storedAppId = store.get("appId");
          const storedClientSecret = store.get("clientSecret");

          console.log("Stored appId:", storedAppId);
          console.log("Stored clientSecret:", storedClientSecret);

          // electronStore.delete("token");
        } else {
          console.error(
            "Response data does not contain appId and clientSecret"
          );
        }
      })
      .catch((error) => console.error("Error:", error));

    return this.handleResponse(authResponse);
  }

  async logout() {
    if (!this.account) return;

    try {
      /**
       * If you would like to end the session with AAD, use the logout endpoint. You'll need to enable
       * the optional token claim 'login_hint' for this to work as expected. For more information, visit:
       * https://learn.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
       */
      if (this.account.idTokenClaims.hasOwnProperty("login_hint")) {
        await shell.openExternal(
          `${
            this.msalConfig.auth.authority
          }/oauth2/v2.0/logout?logout_hint=${encodeURIComponent(
            this.account.idTokenClaims.login_hint
          )}`
        );
      }

      await this.cache.removeAccount(this.account);
      this.account = null;
    } catch (error) {
      console.log(error);
    }
  }

  async getToken(tokenRequest) {
    let authResponse;
    const account = this.account || (await this.getAccount());

    if (account) {
      tokenRequest.account = account;
      authResponse = await this.getTokenSilent(tokenRequest);
    } else {
      authResponse = await this.getTokenInteractive(tokenRequest);
    }

    return authResponse || null;
  }

  async getTokenSilent(tokenRequest) {
    try {
      return await this.clientApplication.acquireTokenSilent(tokenRequest);
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        console.log(
          "Silent token acquisition failed, acquiring token interactive"
        );
        return await this.getTokenInteractive(tokenRequest);
      }

      console.log(error);
    }
  }

  async getTokenInteractive(tokenRequest) {
    try {
      const openBrowser = async (url) => {
        await shell.openExternal(url);
      };

      const authResponse = await this.clientApplication.acquireTokenInteractive(
        {
          ...tokenRequest,
          openBrowser,
          successTemplate:
            "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
          errorTemplate:
            "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
        }
      );

      return authResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
   * @param response
   */
  async handleResponse(response) {
    if (response !== null) {
      this.account = response.account;
    } else {
      this.account = await this.getAccount();
    }

    return this.account;
  }

  /**
   * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
   */
  async getAccount() {
    const currentAccounts = await this.cache.getAllAccounts();

    if (!currentAccounts) {
      console.log("No accounts detected");
      return null;
    }

    if (currentAccounts.length > 1) {
      // Add choose account code here
      console.log(
        "Multiple accounts detected, need to add choose account code."
      );
      return currentAccounts[0];
    } else if (currentAccounts.length === 1) {
      return currentAccounts[0];
    } else {
      return null;
    }
  }
}

module.exports = AuthProvider;
