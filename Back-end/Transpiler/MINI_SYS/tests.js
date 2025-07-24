const systems = require("./index");

const items = [
  {
    miniSYS: {
      using: { embeeding: true },
      settings: { embeeding: [{ type: "spread" }] },
      metadata: { trace: true },
    },
    embeeding: [{ name: "A" }, { name: "B" }],
  },
  {
    miniSYS: {
      using: { forming: true },
      settings: { forming: [{ type: "transform" }] },
      metadata: { trace: true },
    },
    value: (statement, item, setting, processSettings) =>
      `Formed: ${statement}`,
    statement: "test",
  },
];

const processSettings = {
  embeeding: [{ type: "spread" }],
  forming: [{ type: "transform" }],
};

const result = systems.applyMiniSys(items, processSettings);
console.log(result);
