function create() {
  function formEmbeeding(process = "", propositions = []) {
    let r = [];
    for (let i = 0; i < propositions.length; i++) {
      r[i] = {
        embedLevel: {
          sequence: propositions[i],
          level: process,
        },
      };
    }
    return r;
  }
  function formPostCalledUsage(process, propositions) {
    let r = [];
    for (let i = 0; i < propositions.length; i++) {
      r[i] = {
        usedAt: propositions[i],
        proposition: process,
      };
    }
    return r;
  }
  return { formEmbeeding, formPostCalledUsage };
}

module.exports = { create };
