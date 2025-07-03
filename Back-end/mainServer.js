// except handleAPI  everything by gpt 4.1  git copilot
const express = require("express");
const path = require("path");

function handleAPI(request, type) {
  return type;
}

function init() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use(express.static(path.join(__dirname, "../Front-end")));

  // API route: /api/TYPE
  app.post("/api/:type", (req, res) => {
    const type = req.params.type;
    const requestJSON = req.body;
    const result = handleAPI(requestJSON, type);
    res.json(result);
  });

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Front-end/index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = { init };
