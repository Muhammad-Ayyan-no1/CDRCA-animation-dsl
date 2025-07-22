const { json } = require("express");

function create() {
  function satisfiesCondition(Item, Settings) {
    if (!Item.usingSYS || !Item.usingSYS.embeeding) return false;
    if (!Array.isArray(Item.settings)) Item.settings = [Item.settings];
    for (let i = 0; i < Item.settings.length; i++) {
      if (JSON.stringify(Item.settings[i]) === JSON.stringify(Settings)) {
        return true;
      }
    }
    return false;
  }
  function satisfiesCondtions(formingSettings, item) {
    for (let i = 0; i < formingSettings.length; i++) {
      if (satisfiesCondition(formingSettings[i], item)) {
        return i;
      }
    }
    return false;
  }
  function applyEmbeedings(Items, Settings) {
    let r = [];
    for (let i = 0; i < Items.length; i++) {
      let j = satisfiesCondtions(Items[i]);
      if (typeof j === "number") {
        r.push(...Items[i].embeeding);
      } else {
        r.push(Item[i]);
      }
    }
    return r;
  }
  return { applyEmbeedings };
}

module.exports = { create };
