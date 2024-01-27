const express = require("express");
const app = express();
const port = 8000; // Replace with your desired port

// Import route handlers
const dynamicRouter = require("./routes/dynamic");
const staticRouter = require("./routes/static");

// Use route handlers
app.use("/EndpointMatrix/dynamic", dynamicRouter);
app.use("/EndpointMatrix/static", staticRouter);

// Start the Express server
app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});
