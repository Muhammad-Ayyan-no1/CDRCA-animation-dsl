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
    let r = [];
    for (let i = 0; i < items.length; i++) {
      let j = satisfiesConditions(processSettings, items[i]);
      if (typeof j === "number" && Array.isArray(items[i].embeeding)) {
        r.push(...items[i].embeeding);
      } else {
        r.push(items[i]);
      }
    }
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
