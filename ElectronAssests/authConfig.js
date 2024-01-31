const { LogLevel } = require("@azure/msal-node");

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */
const AAD_ENDPOINT_HOST = "https://login.microsoftonline.com/"; // include the trailing slash

const msalConfig = {
    auth: {
        clientId: "aeca6423-3c20-4575-93bf-fd5c17568ffb",
        authority: `${AAD_ENDPOINT_HOST}4d41fa50-108f-4e47-9d0d-f86df7d18c1f`,
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        },
    },
};

/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
const GRAPH_ENDPOINT_HOST = "https://graph.microsoft.com/"; // include the trailing slash

const protectedResources = {
    graphMe: {
        endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/me`,
        scopes: ["User.Read"],
    }
};


module.exports = {
    msalConfig: msalConfig,
    protectedResources: protectedResources,
};