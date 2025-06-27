// this tokenizer is from my GAL compiler project https://github.com/Muhammad-Ayyan-no1/GAL-programming-language-v2 index.js at very top
// it might be an overkill but this is better than a greedy tokenizer
// it uses a trie to match hardcoded tokens and rules to match dynamic tokens
// it also caches the token objects to avoid rebuilding them every time
// so just use it   dont rewrite it  dont waste time on it

// Define the Utilities module
function createUtilities(logs) {
  return {
    log: function (data, type) {
      if (type == "all") {
        if (!Array.isArray(logs.all)) {
          logs.all = [];
        }
        logs.all.push(data);
        return data;
      }
      if (!Array.isArray(logs[type])) {
        logs[type] = [];
      }
      logs[type].push(data);
      if (!Array.isArray(logs.all)) {
        logs.all = [];
      }
      logs.all.push(data);
      return data;
    },
    buildTrie: function (hardcodedList) {
      const root = {};
      for (const item of hardcodedList) {
        const val = typeof item === "string" ? item : item.value;
        const type = typeof item === "string" ? "token" : item.type || "token";
        let node = root;
        for (let char of val) {
          if (!node[char]) node[char] = {};
          node = node[char];
        }
        node._end = { value: val, type: type };
      }
      return root;
    },
    matchFromTrie: function (trie, str, index) {
      let node = trie;
      let lastMatch = null;
      for (let i = index; i < str.length; i++) {
        const char = str[i];
        if (!node[char]) break;
        node = node[char];
        if (node._end) {
          lastMatch = node._end;
        }
      }
      return lastMatch;
    },
  };
}

let Logs = {};
let Utilities = createUtilities(Logs);

const GlobalCache = (function () {
  let cache = new Map();
  Utilities.log("GlobalCache initialized", "info");

  return {
    get: (key) => {
      const result = cache.get(key);
      Utilities.log(
        `Cache GET: ${key} -> ${result ? "HIT" : "MISS"}`,
        "verbose"
      );
      return result;
    },
    set: (key, value) => {
      Utilities.log(`Cache SET: ${key}`, "verbose");
      return cache.set(key, value);
    },
    has: (key) => {
      const result = cache.has(key);
      Utilities.log(`Cache HAS: ${key} -> ${result}`, "verbose");
      return result;
    },
    clear: () => {
      Utilities.log("Cache cleared", "info");
      return cache.clear();
    },
  };
})();

var create_Tokenizer = function () {
  Utilities.log("Creating tokenizer", "info");

  function CacheTokenOBJ(tokenOBJ) {
    Utilities.log("Caching token object", "info");
    const cacheKey = JSON.stringify(tokenOBJ);

    if (GlobalCache.has(cacheKey)) {
      Utilities.log("Using cached token object", "info");
      return GlobalCache.get(cacheKey);
    }

    Utilities.log("Building new cached token object", "info");
    let Cached = {
      rules: [],
      trie: Utilities.buildTrie(tokenOBJ.hardcoded || []),
      hardcoded: {},
    };

    for (const item of tokenOBJ.hardcoded || []) {
      const val = typeof item === "string" ? item : item.value;
      const type = typeof item === "string" ? "token" : item.type || "token";
      Cached.hardcoded[val] = type;
    }

    for (const rule of tokenOBJ.rules || []) {
      if (typeof rule === "function") {
        Cached.rules.push({ fn: rule, priority: 0 });
        Utilities.log(`Added rule function with priority 0`, "verbose");
      } else if (rule && typeof rule.fn === "function") {
        Cached.rules.push(rule);
        Utilities.log(
          `Added rule function with priority ${rule.priority || 0}`,
          "verbose"
        );
      }
    }

    Cached.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    Utilities.log(`Sorted ${Cached.rules.length} rules by priority`, "info");

    GlobalCache.set(cacheKey, Cached);
    return Cached;
  }

  const HARDCODED_PRIORITY = 1000;

  function tokenize(str, tokensOBJ) {
    Utilities.log(`Starting tokenization of string: "${str}"`, "info");
    let Cache = CacheTokenOBJ(tokensOBJ);
    let tokens = [];
    let STRindex = 0;
    let LOGs = [];

    while (STRindex < str.length) {
      Utilities.log(
        `Tokenizing at index ${STRindex}: "${str[STRindex]}"`,
        "verbose"
      );

      let proposed = null;
      let proposedLen = 0;
      let proposedType = null;
      let proposedPri = -Infinity;

      const match = Utilities.matchFromTrie(Cache.trie, str, STRindex);
      if (match) {
        proposed = match.value;
        proposedLen = match.value.length;
        proposedType = match.type;
        proposedPri = HARDCODED_PRIORITY;
        Utilities.log(
          `Hardcoded match found: "${proposed}" (${proposedType})`,
          "verbose"
        );
      }

      for (let rule of Cache.rules) {
        Utilities.log(
          `Checking rule with priority ${rule.priority || 0}`,
          "verbose"
        );
        const result = rule.fn(str, STRindex);
        if (result && result.length > 0) {
          let pri = rule.priority || 0;
          if (tokensOBJ.easeFN) {
            pri = tokensOBJ.easeFN(
              str,
              STRindex,
              STRindex + result.length,
              result.length,
              pri
            );
            Utilities.log(
              `Rule priority adjusted by easeFN: ${pri}`,
              "verbose"
            );
          }
          if (pri > proposedPri) {
            proposed = str.substr(STRindex, result.length);
            proposedLen = result.length;
            proposedType = result.type || "token";
            proposedPri = pri;
            Utilities.log(
              `New best rule match: "${proposed}" (${proposedType}, pri: ${pri})`,
              "verbose"
            );
          }
        }
      }

      if (proposed) {
        const token = { type: proposedType, value: proposed };
        tokens.push(token);
        Utilities.log(`Token created: ${JSON.stringify(token)}`, "info");
        STRindex += proposedLen;
        continue;
      }

      let chunk = str[STRindex];
      const unknownToken = { type: "unknown", value: chunk };
      tokens.push(unknownToken);
      const warning = "Unrecognized character: " + chunk;
      LOGs.push({ warn: warning });
      Utilities.log(warning, "warn");
      Utilities.log(
        `Unknown token created: ${JSON.stringify(unknownToken)}`,
        "warn"
      );
      STRindex++;
    }

    LOGs.push({ info: "tokenization completed" });
    Utilities.log(
      `Tokenization completed. Generated ${tokens.length} tokens`,
      "info"
    );
    return { tokens, logs: LOGs };
  }

  return { tokenize };
};
// everything uses this tokenizer  because it caches stuff  its far better to be use
let tokenizer = create_Tokenizer();

// again this fn is from my GAL compiler project https://github.com/Muhammad-Ayyan-no1/GAL-programming-language-v2 index.js at midish maybe
function cleanTheTokens(tokens) {
  let cleanedTokens = [];
  let currentValue = "";

  function determineType(value) {
    if (/^\d+$/.test(value)) return "number";
    return "identifier";
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.value === " ") {
      if (currentValue !== "") {
        cleanedTokens.push({
          type: determineType(currentValue),
          value: currentValue,
        });
        currentValue = "";
      }
      continue;
    } else if (token.value.length > 1) {
      if (currentValue !== "") {
        cleanedTokens.push({
          type: determineType(currentValue),
          value: currentValue,
        });
        currentValue = "";
      }
      cleanedTokens.push(token);
    } else if (token.value.length === 1 && /[a-zA-Z0-9_]/.test(token.value)) {
      currentValue += token.value;
    } else {
      if (currentValue !== "") {
        cleanedTokens.push({
          type: determineType(currentValue),
          value: currentValue,
        });
        currentValue = "";
      }
      cleanedTokens.push(token);
    }
  }

  if (currentValue !== "") {
    cleanedTokens.push({
      type: determineType(currentValue),
      value: currentValue,
    });
  }

  return cleanedTokens;
}

// --- Tokenizer Integration ---
let OAS_TOKobj = {
  hardcoded: [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    " ",
    "\n",
    "\t",
    "\r",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "{",
    "}",
    "[",
    "]",
    "|",
    "\\",
    ";",
    "'",
    '"',
    "<",
    ">",
    ",",
    ".",
    "/",
    "?",
    "`",
    "~",
    ":",
    "::",
    "def",
    "use",
    "as",
    "abstracts",
    "PROP",
    "ACTION",
    "JS",
    "END",
    "IMPORT",
    "AddImport",
    "@IMPORT",
    "@AddImport",
    "STAY_TIME",
    "LERP_TIME",
    "BGcolor",
    "gredientMap",
    "SCENE",
    "SUB",
    "HEADER",
    "CODE",
    "PRAMS",
  ],
};
function defaultTokenizer(code) {
  let r = cleanTheTokens(tokenizer.tokenize(code, OAS_TOKobj).tokens);
  console.log("TOKENS", JSON.stringify(r, null, 2));
  return r;
}
