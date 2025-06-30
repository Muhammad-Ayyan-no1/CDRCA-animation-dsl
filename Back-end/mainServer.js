const express = require("express");
const path = require("path");
function init() {
  const app = express();
  const PORT = 3000;

  // Serve static files from the Front-end folder
  app.use(express.static(path.join(__dirname, "../Front-end")));

  // Send index.html on root request
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Front-end/index.html"));
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = { init };
