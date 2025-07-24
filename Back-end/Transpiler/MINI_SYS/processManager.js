function create() {
  class ProcessManager {
    constructor(processes = []) {
      this.processes = processes;
      this.neighbours = this.forNeighbourCache(processes);
      this.ProcessApplyingFN = [];
    }

    forNeighbourCache(processes) {
      let n = {};
      for (let i = 0; i < processes.length; i++) {
        n[processes[i]] = {
          prev: processes[i - 1] || false,
          post: processes[i + 1] || false,
        };
      }
      return n;
    }

    getProcessApplyingFNah(process) {
      const i = this.processes.indexOf(process);
      if (i === -1) {
        console.error(`Process ${process} not found`);
        return function () {
          return [];
        };
      }
      if (typeof this.ProcessApplyingFN === "function") {
        return this.ProcessApplyingFN;
      } else if (
        Array.isArray(this.ProcessApplyingFN) &&
        typeof this.ProcessApplyingFN[i] === "function"
      ) {
        return this.ProcessApplyingFN[i];
      }
      console.error(
        "ProcessApplyingFN is not a function nor array of functions",
        process,
        this.ProcessApplyingFN
      );
      return function () {
        return [];
      };
    }

    get FN_allProcessApplied() {
      return function (itemsArr, processSettings = {}) {
        let currentArr = Array.isArray(itemsArr) ? [...itemsArr] : [];
        for (let i = 0; i < this.processes.length; i++) {
          const process = this.processes[i];
          const settings = processSettings[process] || [];
          const fn = this.getProcessApplyingFNah(process);
          currentArr = fn(settings, currentArr);
        }
        return currentArr;
      };
    }
  }

  return { ProcessManager };
}

module.exports = { create };
