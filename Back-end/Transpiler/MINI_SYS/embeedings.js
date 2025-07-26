function create() {
  function satisfiesCondition(item, processSetting) {
    if (!item.miniSYS || !item.miniSYS.using || !item.miniSYS.using.embeeding)
      return false;
    const itemSettings =
      item.miniSYS.settings && item.miniSYS.settings.embeeding
        ? item.miniSYS.settings.embeeding
        : [];
    if (!Array.isArray(itemSettings)) return false;
    for (let i = 0; i < itemSettings.length; i++) {
      if (JSON.stringify(itemSettings[i]) === JSON.stringify(processSetting)) {
        return true;
      }
    }
    return false;
  }

  function satisfiesConditions(processSettings, item) {
    if (!Array.isArray(processSettings)) return false;
    for (let i = 0; i < processSettings.length; i++) {
      if (satisfiesCondition(item, processSettings[i])) {
        return i;
      }
    }
    return false;
  }

  function applyEmbeedings(processSettings, items) {
    // console.log(items.length);
    let r = [];
    for (let i = 0; i < items.length; i++) {
      let j = satisfiesConditions(processSettings, items[i]);
      if (typeof j === "number" && Array.isArray(items[i].embeeding)) {
        // console.log("satisfied (debugging)", items[i]);
        let spreaded = items[i].embeeding;
        // console.log(spreaded);
        for (let j = 0; j < spreaded.length; j++) {
          if (!spreaded[j].metaData) spreaded[j].metaData = {};
          if (!spreaded[j].metaData.formationHistory)
            spreaded[j].metaData.formationHistory = {};

          spreaded[j].metaData.formationHistory.embeeded = {
            embeeded: true,
            spreadedItem: j,
            embeedingNum: i,
            raw: items[i],
          };
        }
        r.push(...spreaded);
      } else {
        r.push(items[i]);
      }
    }
    // console.log(r.length);
    return r;
  }

  return {
    applyEmbeedings,
    ProcessApplyingFNMeta: {
      used: true,
      FN: applyEmbeedings,
    },
  };
}

module.exports = { create };
