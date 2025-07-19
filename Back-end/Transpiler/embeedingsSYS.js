const { json } = require("express");

function create() {
  function formPrioritySequence(raw, priority) {
    // console.log(raw, priority);
    const indices = Array.from({ length: raw.length }, (_, i) => i);
    indices.sort((a, b) => priority[a] - priority[b]);
    return indices.map((i) => raw[i]);
  }

  function EaitherTypeConnectionAdvice(possbles) {
    for (let i = 0; i < possbles.length; i++) {
      if (possbles[i]) return i;
    }
    return possbles[0];
  }
  function getConnectionAdvice(possibles, connection) {
    switch (connection) {
      default:
      case "eaither":
        return EaitherTypeConnectionAdvice(possibles);
        break;
    }
    return possibles[0];
  }

  function openEmbeedingsMutliSetting(
    blockARR,
    systemSettingsArr,
    connection,
    priority
  ) {
    let prioritizedSequence = formPrioritySequence(systemSettingsArr, priority);
    let possible = [];
    for (let i = 0; i < prioritizedSequence.length; i++) {
      if (openEmbeedingsPossible(blockARR, prioritizedSequence[i])) {
        possible[i] = true;
      } else {
        possible[i] = false;
      }
    }
    let usingSetting = getConnectionAdvice(possible, connection);
    return openEmbeedings(blockARR, systemSettingsArr[usingSetting]);
  }

  function openEmbeedingsPossible(blockARR, systemSettings) {
    let r = openEmbeedings(blockARR, systemSettings);
    if (JSON.stringify(r) === JSON.stringify(blockARR)) return false;
    return true;
  }

  function openEmbeedings(blockARR, systemSettings) {
    let r = [];
    for (let i = 0; i < blockARR.length; i++) {
      if (!blockARR[i].embeeding) r.push(blockARR[i]);
      else r.push(...(openAnEmbeeding(blockARR[i], systemSettings) || []));
    }
    return r;
  }

  function openAnEmbeeding(embeeding, systemSettings) {
    let r = embeeding.value;
    let bool = true;
    if (
      systemSettings.embedLevel.sequence !==
        embeeding.embededSettings.embedLevel.sequence ||
      systemSettings.embedLevel.level !==
        embeeding.embededSettings.embedLevel.level
    ) {
      bool = false;
    }
    if (bool) {
      return r;
    }
    return embeedingReturning(embeeding);
  }
  function embeedingReturning(embeeding) {
    if (!embeeding.embededSettings.returnSettings) return [];
    let returnBehaviour = embeeding.embededSettings.returnSettings;
    if (typeof returnBehaviour.returnFN === "function") {
      embeeding = returnBehaviour.returnFN(embeeding);
    }

    if (Array.isArray(embeeding)) return embeeding;
    else return [embeeding];
  }
  return { openEmbeedings, openEmbeedingsMutliSetting };
}

module.exports = { create };
