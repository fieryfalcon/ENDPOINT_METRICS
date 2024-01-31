const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');


const getGraphClient = (accessToken) => {
    // Initialize Graph client
    const graphClient = Client.init({
        // Use the provided access token to authenticate requests
        authProvider: (done) => {
            done(null, accessToken);
        },
    });

    return graphClient;
};

module.exports = getGraphClient;