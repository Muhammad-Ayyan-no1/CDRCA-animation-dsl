function create() {
  function satisfiesCondition(formingSetting, Item) {
    if (!Item.usingSYS || !Item.usingSYS.forming) return false;
    if (!Array.isArray(Item.formingSetting))
      Item.formingSetting = [Item.formingSetting];
    for (let i = 0; i < Item.formingSetting.length; i++) {
      if (JSON.stringify(Item.formingSetting[i]) === formingSetting) {
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
  function applyForming(Items, settings) {
    for (let i = 0; i < Items.length; i++) {
      let j = satisfiesCondtions(settings, Items[i]);
      if (j && typeof Items[i] === "function") {
        Items[i].value = Items[i].value(
          Items[i].statement,
          Items[i],
          settings[j],
          settings
        );
      }
    }
    return Items;
  }
  return { applyForming };
}
