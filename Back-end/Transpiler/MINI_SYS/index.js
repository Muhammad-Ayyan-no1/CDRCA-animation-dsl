let systems = {
  embeeding: require("./embeedings"),
  forming: require("./forming"),
  processManager: require("./processManager"),
};

let ProcessApplyingFNs = {
  processes: [],
  fns: [],
};

for (const sys in systems) {
  if (typeof systems[sys].create !== "function") {
    console.warn(`${sys} system in mini sys not valid`);
    continue;
  }
  let createdSYS = systems[sys].create();
  if (
    !createdSYS.ProcessApplyingFNMeta ||
    !createdSYS.ProcessApplyingFNMeta.used ||
    typeof createdSYS.ProcessApplyingFNMeta.FN !== "function"
  ) {
    continue;
  }
  ProcessApplyingFNs.processes.push(sys);
  ProcessApplyingFNs.fns.push(createdSYS.ProcessApplyingFNMeta.FN);
}

const { ProcessManager } = systems.processManager.create();
let applyMiniSys_processManager = new ProcessManager(
  ProcessApplyingFNs.processes
);
applyMiniSys_processManager.ProcessApplyingFN = ProcessApplyingFNs.fns;

systems = {
  applyMiniSys: function (itemsArr = [], processSettings = {}) {
    return applyMiniSys_processManager.FN_allProcessApplied(
      itemsArr,
      processSettings
    );
  },
  ...systems,
};

module.exports = systems;
