function create() {
  function satisfiesCondition(item, processSetting) {
    if (!item.miniSYS || !item.miniSYS.using || !item.miniSYS.using.forming)
      return false;
    const itemSettings =
      item.miniSYS.settings && item.miniSYS.settings.forming
        ? item.miniSYS.settings.forming
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

  function applyForming(processSettings, items) {
    let result = [...items];
    for (let i = 0; i < result.length; i++) {
      let j = satisfiesConditions(processSettings, result[i]);
      if (j !== false && typeof result[i].value === "function") {
        result[i] = {
          ...result[i],
          value: result[i].value(
            result[i].statement,
            result[i],
            processSettings[j],
            processSettings
          ),
        };
      }
    }
    return result;
  }

  return {
    applyForming,
    ProcessApplyingFNMeta: {
      used: true,
      FN: applyForming,
    },
  };
}

module.exports = { create };
