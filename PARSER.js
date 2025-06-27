// THE DSl parser  for making everything a .cdrca  file (node js only)
/*
NOTE: NOT worked on big compiler but on small solo project          (if anyone edits the parser update the previous NOTE)
SYNTAX: bellow
--- header text stuff :: Some comment ---
CODE based on that text

CODE :
// comment  js type stuff here
JS {
}  to embeed a js fn call using (()->{YOUR CODE from JS block})()

for import header or any other header (NODE JS only)
@IMPORT File Path       to hoist a file
@AddImport File Path    to add a file at this position
files are just copied and pasted at that position  like #include in cpp  but anywhere

for props header
define a prop by         def PROP PROP_NAME abstracts optionOtherPROP { code of the prop as a js code }
use a prop by    use PROPNAME(prams) as NAME  

for Defaults header
to set default gredient      gredientMap :: [arr of vals] / num / num / formate (RGB)
for BG color                 BGcolor :: color
similar for stay end time

for actions header
define an action by         def ACTION ACTION_NAME PROP_NAME METHOD_NAME PRAMS / you can add more PROP_NAME and PRAMS and METHOD_NAME
now use it by just saying           add new action STAY_TIME LERP_TIME

for SCENE header
to add a sub header just     :: SUB header   
SUB hedaers include actions, default props


example:
nope,  i dont understand this syntax myself after writing the parser
but it works so i dont care
*/
const OAS_PARSER = function () {
  // --- Header Parsing Functions ---
  function findNextHeaderStart(string, position) {
    while (position < string.length) {
      if (string[position] === "!") {
        let startSeqPos = position + 1;
        while (startSeqPos < string.length && /\s/.test(string[startSeqPos])) {
          startSeqPos += 1;
        }
        if (startSeqPos >= string.length) {
          position += 1;
          continue;
        }
        const C = string[startSeqPos];
        let N = 1;
        while (
          startSeqPos + N < string.length &&
          string[startSeqPos + N] === C
        ) {
          N += 1;
        }
        const seq = C.repeat(N);
        const nextSeqPos = string.indexOf(seq, startSeqPos + N);
        if (nextSeqPos !== -1) {
          const headerContent = string.slice(startSeqPos + N, nextSeqPos);
          return [position, N, C, headerContent];
        }
      }
      position += 1;
    }
    return null;
  }

  function parseContent(string) {
    const contentList = [];
    let position = 0;
    while (position < string.length) {
      const nextSubheader = string.indexOf("::", position);
      if (nextSubheader === -1) {
        if (position < string.length) {
          contentList.push({ STR: string.slice(position).trim() });
        }
        break;
      }
      if (position < nextSubheader) {
        contentList.push({ STR: string.slice(position, nextSubheader).trim() });
      }
      const [subheaderNode, newPosition] = parseSubheader(
        string,
        nextSubheader
      );
      contentList.push({ "SUB-HEADER": [subheaderNode] });
      position = newPosition;
    }
    return contentList;
  }

  function parseSubheader(string, position) {
    const nextColon = string.indexOf("::", position + 2);
    if (nextColon === -1) {
      throw new Error(`Invalid subheader syntax at position ${position}`);
    }
    const subheaderHeader = string.slice(position + 2, nextColon).trim();
    const parts = subheaderHeader.split("::");
    const usedTypes = parts[0].trim().split(/\s+/);
    const comment = parts.length > 1 ? parts[1].trim() : "";
    const subContentStart = nextColon + 2;
    let nesting = 1;
    let subPosition = subContentStart;
    while (subPosition < string.length) {
      const nextColon = string.indexOf("::", subPosition);
      if (nextColon === -1) {
        throw new Error(`Unclosed subheader at position ${position}`);
      }
      const afterColon =
        string.slice(nextColon + 2).match(/^\s*(\w+)/)?.[1] || "";
      if (afterColon === "END") {
        nesting -= 1;
        if (nesting === 0) {
          const subContentEnd = nextColon;
          const subContentString = string.slice(subContentStart, subContentEnd);
          const parsedSubContent = parseContent(subContentString);
          return [
            {
              USED: usedTypes,
              COMMENT: comment,
              CODE: parsedSubContent,
            },
            nextColon + string.slice(nextColon).indexOf("END") + 3,
          ];
        }
      } else {
        nesting += 1;
      }
      subPosition = nextColon + 2;
    }
    throw new Error(`Unclosed subheader at position ${position}`);
  }

  function parseTopLevel(string) {
    const items = [];
    let position = 0;
    while (position < string.length) {
      const nextHeader = findNextHeaderStart(string, position);
      if (nextHeader) {
        const [startPos, N, C, headerContent] = nextHeader;
        const codeBefore = string.slice(position, startPos).trim();
        if (codeBefore) {
          items.push({ TYPE: "CODE", VALUE: codeBefore });
        }
        const parts = headerContent.trim().split("::");
        const usedTypes = parts[0].trim().split(/\s+/);
        const comment = parts.length > 1 ? parts[1].trim() : "";
        const seq = C.repeat(N);
        const endTag = "!" + seq + "END" + seq;
        const headerLineEnd =
          string.indexOf("\n", startPos) === -1
            ? string.length
            : string.indexOf("\n", startPos);
        const contentStart = headerLineEnd + 1;
        const endPos = string.indexOf(endTag, contentStart);
        if (endPos === -1) {
          throw new Error(`Unclosed main header at position ${startPos}`);
        }
        const contentString = string.slice(contentStart, endPos);
        const parsedContent = parseContent(contentString);
        items.push({
          TYPE: "HEADER",
          VALUE: { USED: usedTypes, COMMENT: comment, CODE: parsedContent },
        });
        position = endPos + endTag.length;
      } else {
        const codeAfter = string.slice(position).trim();
        if (codeAfter) {
          items.push({ TYPE: "CODE", VALUE: codeAfter });
        }
        break;
      }
    }
    return items;
  }

  // --- Statement Parsing Functions ---
  function parseStatements(code) {
    const tokens = defaultTokenizer(code);
    const statements = [];
    let pos = 0;
    while (pos < tokens.length) {
      while (pos < tokens.length && tokens[pos].value === "\n") pos++;
      if (pos >= tokens.length) break;
      const statement = parseStatement(tokens, pos);
      statements.push(statement);
      pos = statement.newPosition;
    }
    return statements;
  }

  function parseStatement(tokens, pos) {
    const token = tokens[pos];
    switch (token.value) {
      case "@IMPORT":
        return parseImport(tokens, pos, "IMPORT");
      case "@AddImport":
        return parseImport(tokens, pos, "ADD_IMPORT");
      case "JS":
        return parseJSBlock(tokens, pos);
      case "def":
        return parseDefStatement(tokens, pos);
      case "use":
        return parsePropUse(tokens, pos);
      case "add":
        return parseActionUse(tokens, pos);
      case "gredientMap":
        return parseDefault(tokens, pos, "GREDIENT_MAP");
      case "BGcolor":
        return parseDefault(tokens, pos, "BGCOLOR");
      case "//":
        return parseComment(tokens, pos);
      default:
        throw new Error(`Unexpected token at position ${pos}: ${token.value}`);
    }
  }

  function parseImport(tokens, pos, type) {
    pos++;
    if (pos >= tokens.length) throw new Error(`${type} missing file path`);
    const path = tokens[pos].value;
    pos++;
    while (pos < tokens.length && tokens[pos].value !== "\n") pos++;
    return { type, prams: { path }, newPosition: pos };
  }

  function parseJSBlock(tokens, pos) {
    pos++;
    if (pos >= tokens.length || tokens[pos].value !== "{")
      throw new Error("Expected '{' after JS");
    pos++;
    let depth = 1;
    const codeTokens = [];
    while (pos < tokens.length && depth > 0) {
      const token = tokens[pos];
      if (token.value === "{") depth++;
      else if (token.value === "}") depth--;
      if (depth > 0) codeTokens.push(token);
      pos++;
    }
    if (depth !== 0) throw new Error("Unclosed JS block");
    const code = codeTokens.map((t) => t.value).join(" ");
    return { type: "JS_BLOCK", prams: { code }, newPosition: pos };
  }

  function parseDefStatement(tokens, pos) {
    pos++;
    if (pos >= tokens.length)
      throw new Error("Expected PROP or ACTION after 'def'");
    const type = tokens[pos].value;
    if (type === "PROP") return parsePropDef(tokens, pos);
    if (type === "ACTION") return parseActionDef(tokens, pos);
    throw new Error(`Unexpected definition type: ${type}`);
  }

  function parsePropDef(tokens, pos) {
    // pos++; // Skip "PROP"
    // pos++;
    pos += 2;
    if (pos >= tokens.length)
      throw new Error("Expected property name in PROPS defination");
    const name = tokens[pos].value;
    pos++;
    let abstracts = false;
    let optionOtherPROP = null;
    if (pos < tokens.length && tokens[pos].value === "abstracts") {
      abstracts = true;
      pos++;
      if (pos >= tokens.length)
        throw new Error("Expected other PROP name after 'abstracts'");
      optionOtherPROP = tokens[pos].value;
      pos++;
    }
    if (pos >= tokens.length || tokens[pos].value !== "{")
      throw new Error("Expected '{' in property definition");
    pos++;
    let depth = 1;
    const codeTokens = [];
    while (pos < tokens.length && depth > 0) {
      const token = tokens[pos];
      if (token.value === "{") depth++;
      else if (token.value === "}") depth--;
      if (depth > 0) codeTokens.push(token);
      pos++;
    }
    if (depth !== 0) throw new Error("Unclosed property definition");
    const code = codeTokens.map((t) => t.value).join(" ");
    return {
      type: "PROP_DEF",
      prams: { name, abstracts, optionOtherPROP, code },
      newPosition: pos,
    };
  }

  function parseActionDef(tokens, pos) {
    pos++; // Skip "ACTION"
    pos++;
    if (pos >= tokens.length) throw new Error("Expected action name");
    const name = tokens[pos].value;
    pos++;
    const parts = [];
    while (pos < tokens.length && tokens[pos].value !== "\n") {
      const propName = tokens[pos].value;
      pos++;
      if (pos >= tokens.length)
        throw new Error("Expected method name in action definition");
      const methodName = tokens[pos].value;
      pos++;
      if (pos >= tokens.length)
        throw new Error("Expected parameters in action definition");
      const prams = tokens[pos].value;
      pos++;
      parts.push({ propName, methodName, prams });
    }
    return { type: "ACTION_DEF", prams: { name, parts }, newPosition: pos };
  }

  function parsePropUse(tokens, pos) {
    pos++;
    if (pos >= tokens.length)
      throw new Error("Expected property name after 'use'");
    const name = tokens[pos].value;
    pos++;
    if (pos >= tokens.length || tokens[pos].value !== "(")
      throw new Error("Expected '(' in property use");
    pos++;
    let depth = 1;
    const pramsTokens = [];
    while (pos < tokens.length && depth > 0) {
      const token = tokens[pos];
      if (token.value === "(") depth++;
      else if (token.value === ")") depth--;
      if (depth > 0) pramsTokens.push(token);
      pos++;
    }
    if (depth !== 0) throw new Error("Unclosed parameters in property use");
    const prams = pramsTokens.map((t) => t.value).join(" ");
    pos++;
    if (pos >= tokens.length || tokens[pos].value !== "as")
      throw new Error("Expected 'as' in property use");
    pos++;
    if (pos >= tokens.length) throw new Error("Expected alias name after 'as'");
    const alias = tokens[pos].value;
    pos++;
    return {
      type: "PROP_USE",
      prams: { name, prams, as: alias },
      newPosition: pos,
    };
  }

  function parseActionUse(tokens, pos) {
    pos++;
    if (pos >= tokens.length || tokens[pos].value !== "new")
      throw new Error("Expected 'new' in action use");
    pos++;
    if (pos >= tokens.length || tokens[pos].value !== "action")
      throw new Error("Expected 'action' in action use");
    pos++;
    if (pos >= tokens.length)
      throw new Error("Expected stay time in action use");
    const stayTime = tokens[pos].value;
    pos++;
    if (pos >= tokens.length)
      throw new Error("Expected lerp time in action use");
    const lerpTime = tokens[pos].value;
    pos++;
    return {
      type: "ACTION_USE",
      prams: { stayTime, lerpTime },
      newPosition: pos,
    };
  }

  function parseDefault(tokens, pos, type) {
    const keyword = tokens[pos].value;
    pos++;
    if (pos >= tokens.length || tokens[pos].value !== "::")
      throw new Error(`Expected '::' after ${keyword}`);
    pos++;
    const valueTokens = [];
    while (pos < tokens.length && tokens[pos].value !== "\n") {
      valueTokens.push(tokens[pos]);
      pos++;
    }
    const value = valueTokens.map((t) => t.value).join(" ");
    return { type, prams: { value }, newPosition: pos };
  }

  function parseComment(tokens, pos) {
    pos++;
    const commentTokens = [];
    while (pos < tokens.length && tokens[pos].value !== "\n") {
      commentTokens.push(tokens[pos]);
      pos++;
    }
    const value = commentTokens.map((t) => t.value).join(" ");
    return { type: "COMMENT", value, newPosition: pos };
  }

  // --- AST Processing ---
  function processCodeList(codeList) {
    const result = [];
    let currentCode = "";
    for (const item of codeList) {
      if (item.STR) {
        currentCode += item.STR + "\n";
      } else if (item["SUB-HEADER"]) {
        if (currentCode.trim()) {
          result.push({
            TYPE: "STATEMENTS",
            VALUE: parseStatements(currentCode),
          });
          currentCode = "";
        }
        const subheader = item["SUB-HEADER"][0];
        subheader.CODE = processCodeList(subheader.CODE);
        result.push({ "SUB-HEADER": [subheader] });
      }
    }
    if (currentCode.trim()) {
      result.push({ TYPE: "STATEMENTS", VALUE: parseStatements(currentCode) });
    }
    return result;
  }

  function parse(code) {
    const topLevelItems = parseTopLevel(code);
    return topLevelItems.map((item) => {
      if (item.TYPE === "CODE") {
        return { TYPE: "STATEMENTS", VALUE: parseStatements(item.VALUE) };
      } else if (item.TYPE === "HEADER") {
        item.VALUE.CODE = processCodeList(item.VALUE.CODE);
        return item;
      }
    });
  }

  // --- Traversal Functions ---
  function traverseIn(ast, callback) {
    function traverse(node, depth = RC) {
      if (Array.isArray(node)) {
        node.forEach((item) => traverse(item, depth));
      } else if (node.TYPE === "HEADER") {
        callback(node.VALUE, true, depth);
        node.VALUE.CODE.forEach((child) => {
          if (child["SUB-HEADER"]) {
            traverse(child["SUB-HEADER"], depth + 1);
          }
        });
      }
    }
    traverse(ast);
  }

  function traverseOut(ast, callback) {
    function traverse(node, depth = 0) {
      if (Array.isArray(node)) {
        node.forEach((item) => traverse(item, depth));
      } else if (node.TYPE === "HEADER") {
        node.VALUE.CODE.forEach((child) => {
          if (child["SUB-HEADER"]) {
            traverse(child["SUB-HEADER"], depth + 1);
          }
        });
        callback(node.VALUE, false, depth);
      }
    }
    traverse(ast);
  }

  return {
    parse,
    traverseIn,
    traverseOut,
  };
};

let OAS_PARSER_INS = OAS_PARSER();

console.log(JSON.stringify(OAS_PARSER_INS.parse(`@IMPORT abc`), null, 2));
console.log(
  JSON.stringify(
    OAS_PARSER_INS.parse(`
! --- PROP ABC :: comment ---
def PROP MyProp { console.log("hi"); }
:: SUB HEADER :: sub comment
use MyProp(params) as Alias
:: END
!---END---
`),
    null,
    2
  )
);
