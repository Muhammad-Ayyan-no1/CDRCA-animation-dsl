// THE DSl parser  for making everything a .cdrca  file
/*
NOTE: NOT worked on big compiler but on small solo project          (if anyone edits the parser update the previous NOTE)
SYNTAX: bellow
--- header text stuff :: Some comment ---
CODE based on that text

CODE :
// comment  js type stuff here
JS {
}  to embeed a js fn call using (()->{YOUR CODE from JS block})()

for import header or any other header
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
! #custom header stuff# SCENE :: Yes can combine headers, its just a compile time check not needed to be separated @ AS well as this can be anything @
! :: --- PROPS HEADER DEFAULTS ACTIONS :: defaults ---
//--- this of scene 1  btw --- and these "---" are just comment no Compiler stuff
*/
const OAS_PARSER = function () {
  function parseMainHeaders(string) {
    const headers = [];
    let position = 0;
    while (position < string.length) {
      const nextHeader = findNextHeaderStart(string, position);
      if (!nextHeader) {
        if (position < string.length) {
          throw new Error(
            `Unexpected content at position ${position}: "${string.slice(
              position,
              position + 20
            )}..."`
          );
        }
        break;
      }
      const [startPos, N, C, headerContent] = nextHeader;
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
      let endPos = -1;
      let searchPos = contentStart;
      while (searchPos < string.length) {
        let lineEnd = string.indexOf("\n", searchPos);
        if (lineEnd === -1) lineEnd = string.length;
        const line = string.slice(searchPos, lineEnd).trimStart();
        if (line.startsWith(endTag)) {
          endPos = searchPos + line.indexOf(endTag);
          break;
        }
        searchPos = lineEnd + 1;
      }
      if (endPos === -1) {
        throw new Error(
          `Unclosed main header starting at position ${startPos}`
        );
      }
      const contentString = string.slice(contentStart, endPos);
      const parsedContent = parseContent(contentString);
      const headerNode = {
        USED: usedTypes,
        COMMENT: comment,
        CODE: parsedContent,
      };
      headers.push(headerNode);
      position = endPos + endTag.length;
    }
    return headers;
  }

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
          const subheaderNode = {
            USED: usedTypes,
            COMMENT: comment,
            CODE: parsedSubContent,
          };
          const newPosition =
            nextColon + string.slice(nextColon).indexOf("END") + 3;
          return [subheaderNode, newPosition];
        }
      } else {
        nesting += 1;
      }
      subPosition = nextColon + 2;
    }
    throw new Error(`Unclosed subheader at position ${position}`);
  }

  function traverseIn(ast, callback) {
    function traverse(node, depth = 0) {
      if (Array.isArray(node)) {
        node.forEach((item) => traverse(item, depth));
      } else if (node.USED) {
        callback(node, true, depth);
        node.CODE.forEach((child) => {
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
      } else if (node.USED) {
        node.CODE.forEach((child) => {
          if (child["SUB-HEADER"]) {
            traverse(child["SUB-HEADER"], depth + 1);
          }
        });
        callback(node, false, depth);
      }
    }
    traverse(ast);
  }

  return {
    parse: parseMainHeaders,
    traverseIn,
    traverseOut,
  };
};

let OAS_PARSER_INS = OAS_PARSER();

// Test with corrected input
console.log(
  JSON.stringify(
    OAS_PARSER_INS.parse(`! --- PROP ABC :: comment ---
code stuff
:: SUB HEADER :: comment
    code stuff
:: END
!---END---`),
    null,
    2
  )
);
