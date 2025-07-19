/*

What our renderer API wants:

let ObjectAnimationSystem_INS = ObjectAnimationSystem();
 defining actions props stuff here
ObjectAnimationSystem_INS.main({
  defaultGredientMap: new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]),
    3,
    1,
    THREE.RGBFormat
  ),
  scenes: [
    {
      stayTimeInit: 1000,
      stayTimeEnd: 1000,
      lerpTime: 500,
      backgroundColor: 0x000000,
      PropsDef: [
        new ObjectAnimationSystem_INS.CORE_3d_PROPSsceneSYS.exampleProps.RotatingCubeProp(
          0x00ff00,
          1
        ),
      ],
      actions: [
        {
          stayTime: 2000,
          lerpTime: 500,
          action: (PropsArr) => {
            // u can also call any method and hence do default stuff too
            // if (PropsArr[0].doAction) {
            //   PropsArr[0].doAction(); // after this commit are supported
            // }
            return PropsArr.map(
              (prop) => (mesh, totalTime, lerpProgress, step) => {
                mesh.position.x = Math.sin(totalTime);
                mesh.position.y = Math.cos(totalTime);
                return mesh;
              }
            );
          },
        },
      ],
    },
  ],
}).init(60, true);

so we just needs to define stuff outside this obj like actions      and just translate rest to a js obj
*/
const createTranspiler = function (parserINSs, embeedingSYS_INS) {
  var PROPStoIndex_MAP = {};
  function createPROPdef(statment) {
    let code = `class ${statment.prams.name} extends`;
    let extendsClasses = [
      "ObjectAnimationSystem_INS.CORE_3d_PROPSsceneSYS.Prop",
    ]; // we always extend the base prop
    if (statment.prams.abstracts) {
      extendsClasses.push(...(statment.prams.optionOtherPROP.split(",") || []));
    }
    code += ` mixClasses([${extendsClasses.join(",")}])`; //mixClasses extends all the classes and returns a new class to be extended as   N+M extends ... N+2 extends N + 1 extends N    N be arr item from 0th index and M being arr.len

    code += `{
${statment.prams.code}    
}`;
    return code;
  }

  function createActionDef(statment) {
    // this should create more of a js fn  for sending actions to various props
    let fn = `function ACTION_${
      statment.prams.name
    }(PropsARR,preFN,postFN, btweenFNpre, btweenFNpost){
    const inpPrams = [PropsARR,preFN,postFN, btweenFNpre, btweenFNpost]
    preFN(inpPrams);
    var prop;
    var prams = [];
    ${(function () {
      let r = "";
      for (let i = 0; i < statment.prams.parts.length; i++) {
        let part = statment.prams.parts[i];
        r += `
        prop = PropsARR[Number(${JSON.stringify(
          PROPStoIndex_MAP[part.propName]
        )})||0],

        prams = [inpPrams,${i},${JSON.stringify(
          PROPStoIndex_MAP[part.propName]
        )}, ${JSON.stringify(part.propName)}, ${JSON.stringify(
          part.methodName
        )}, prop, ${JSON.stringify(statment.prams.prams)}];

        btweenFNpre(prams);
        prop.${part.methodName}(${statment.prams.prams});
        btweenFNpost(prams);
      }`;
      }
      return r;
    })()}
    postFN(inpPrams)`;
    return fn;
  }
  function createPropUSE(statement) {
    // bellow is commented condition because theres no reason to check .as   its randomly generated else wise

    // if (statement.prams.as) {
    return `var ${statement.prams.as} = new ${statement.prams.name}(${statement.prams.prams});`;
    // } else {
    //   return `${statement.prams.name}(${statement.prams.prams});`;
    // }
  }
  function ImportEmbeding(statement, options) {
    console.warn("import system is not working  under dev");
    // // handled by the post semantic analysis
    // return {
    //   statement: statement,
    //   value: statement.prams.path,
    //   type: "IMPORT",
    // };
    // embeding is partially transpiled tree not a string      we just directly inject the tree with current one
    // yes its recursive  TODO make it non recursive
    let embeded = options.sysProcessFNs.mainMultiFile(
      options.VFS,
      options,
      statement.prams.path,
      options.sysProcessFNs.tillPartialTranspilationTranspiler_UniFile
    );
    // console.log(embeded);
    return {
      value: embeded,
      embededSettings: {
        embedLevel: {
          sequence: "after",
          level: "hoistingEngine",
        },
      },
      type: "IMPORT",
      embeeding: true,
      hoisted: {
        hoist: true,
        group: {
          AND: [["IMPORT"]],
          // OR: [],
        },
        target: { line: 1 },
        upperPriority: {
          AND: [["PROP_USE"]],
          OR: [["PROP_USE"]],
        },
      },
    };
  }
  function ADD_ImportEmbeding(statement, options) {
    console.warn("import system is not working  under dev");
    // handled by the post semantic analysis
    // return {
    //   statement: statement,
    //   value: statement.prams.path,
    //   type: "ADD_IMPORT",
    // };
    // embeding is partially transpiled tree not a string      we just directly inject the tree with current one
    // yes its recursive  TODO make it non recursive
    let embeded = options.sysProcessFNs.mainMultiFile(
      options.VFS,
      options,
      statement.prams.path,
      options.sysProcessFNs.tillPartialTranspilationTranspiler_UniFile
    );
    // console.log(embeded);
    return {
      embededSettings: {
        embedLevel: {
          sequence: "at",
          level: "PartialTranspiler",
        },
      },
      value: embeded,
      type: "IMPORT",
      embeeding: true,
    };
  }
  function transpileStatement(statement, options) {
    switch (statement.type) {
      case "IMPORT":
        return ImportEmbeding(statement, options);
        break;
      case "ADD_IMPORT":
        return ADD_ImportEmbeding(statement, options);
        break;
      case "JS_BLOCK":
        return { value: `(()=>{${statement.prams.code}})()`, type: "JS_BLOCK" };
        break;
      case "PROP_DEF":
        return {
          statement: statement,
          value: createPROPdef(statement),
          type: "PROP_DEF",
          hoisted: {
            hoist: true,
            group: {
              AND: [["PROP_DEF"]],
              // OR: [],
            },
            target: { line: 1 },
            upperPriority: {
              AND: [["ACTION_DEF"]],
              OR: [["ACTION_DEF"]],
            },
          },
        };
        break;
      case "ACTION_DEF":
        return {
          statement: statement,
          value: createActionDef(statement),
          type: "ACTION_DEF",
          hoisted: {
            hoist: true,
            group: {
              AND: [["ACTION_DEF"]],
              // OR: [],
            },
            target: { line: 0 },
            lowerPriority: {
              AND: [["PROP_DEF"]],
              OR: [["PROP_DEF"]],
            },
          },
        };
        break;
      case "PROP_USE":
        return {
          statement: statement,
          value: createPropUSE(statement),
          usageValue: `${statement.prams.as},`,
          type: "PROP_USE",
        };
        break;
      // THE OBJ STACK used stuff
      case "ACTION_USE":
        return {
          statement: statement,
          value: `var ${statement.prams.actionUseName} = {
        stayTime : ${statement.prams.stayTime},
        lerpTime : ${statement.prams.lerpTime},
        action : ${statement.prams.actionName}
        }`,
          usageValue: `${statement.prams.actionUseName},`,
          type: "ACTION_USE",
        };
        break;
      case "GREDIENT_MAP":
        /*
defaultGredientMap: new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]),
    3,
    1,
    THREE.RGBFormat
  ),
        */
        let prams = JSON.parse("[" + statement.prams.value + "]");
        return {
          statement: statement,
          value: `defaultGredientMap : new THREE.DataTexture(
        new Uint8Array(${
          prams[0] || "[255, 255, 255, 255, 255, 255, 255, 255, 255]"
        }),
        ${prams[1] || 3},
        ${prams[2] || 1},
        THREE.${String(prams[3]) || "RGB"}Format
      ),`,
          type: "GREDIENT_MAP",
        };
        break;
      case "BGCOLOR":
        return {
          statement: statement,
          value: `backgroundColor: ${statement.prams.value},`,
          type: "BGCOLOR",
        };
        break;
      case "COMMENT":
        return {
          statement: statement,
          value: `// ${statement.prams.value}`,
          type: "COMMENT",
        };
        break;
      default:
        throw new Error(`Unknown statement type: ${statement.type}`);
        break;
    }
  }

  function transpileStatements(statements, options) {
    // let r = statements.map(transpileStatement); //.join("\n");
    let r = [];
    for (let i = 0; i < statements.length; i++) {
      r[i] = transpileStatement(statements[i], options);
    }

    // console.log("TS: ", r);
    return r;
  }

  function MakeARR(item) {
    if (Array.isArray(item)) return item;
    return [item];
  }

  // Main transpiler function that processes the entire AST iteratively
  // function transpile(ast) {
  //   if (!Array.isArray(ast)) {
  //     throw new Error("AST must be an array");
  //   }

  //   const stack = [];
  //   const codeBlocks = [];

  //   for (let i = ast.length - 1; i >= 0; i--) {
  //     stack.push(ast[i]);
  //   }

  //   while (stack.length > 0) {
  //     const node = stack.pop();

  //     if (node.TYPE === "STATEMENTS") {
  //       const statementsCode = transpileStatements(node.VALUE);
  //       codeBlocks.push(...MakeARR(statementsCode));
  //     } else if (node.TYPE === "HEADER") {
  //       const childNodes = node.VALUE.CODE;
  //       for (let i = childNodes.length - 1; i >= 0; i--) {
  //         stack.push(childNodes[i]);
  //       }
  //     } else if (node["SUB-HEADER"]) {
  //       const childNodes = node["SUB-HEADER"][0].CODE;
  //       for (let i = childNodes.length - 1; i >= 0; i--) {
  //         stack.push(childNodes[i]);
  //       }
  //     } else {
  //       throw new Error("Unknown item type in AST");
  //     }
  //   }

  //   // return codeBlocks.join("\n");
  //   return codeBlocks;
  // }

  function transpile(ast, options) {
    if (!Array.isArray(ast)) {
      throw new Error("AST must be an array");
    }

    const stack = [];
    let codeBlocks = [];

    for (let i = ast.length - 1; i >= 0; i--) {
      stack.push(ast[i]);
    }

    while (stack.length > 0) {
      const node = stack.pop();

      if (node.TYPE === "STATEMENTS") {
        const statementsCode = transpileStatements(node.VALUE, options);
        codeBlocks.push(...MakeARR(statementsCode));
      } else if (node.TYPE === "HEADER") {
        // Add opening spacer
        codeBlocks.push({
          prams: {
            gate: "opening",
            ast: node,
            type: "Header",
          },
          type: "Header",
          gate: "opening",
          value: "Header opening",
          ast: node,
        });
        const childNodes = node.VALUE.CODE;
        for (let i = childNodes.length - 1; i >= 0; i--) {
          stack.push(childNodes[i]);
        }

        // Add closing spacer
        codeBlocks.push({
          prams: {
            gate: "closing",
            ast: node,
            type: "Header",
          },
          type: "Header",
          gate: "closing",
          value: "Header closing",
          ast: node,
        });
      } else if (node["SUB-HEADER"]) {
        // Add opening spacer
        codeBlocks.push({
          prams: {
            gate: "opening",
            ast: node,
            type: "SubHeader",
          },
          type: "SubHeader",
          gate: "opening",
          value: "SubHeader opening",
          ast: node,
        });
        const childNodes = node["SUB-HEADER"][0].CODE;
        for (let i = childNodes.length - 1; i >= 0; i--) {
          stack.push(childNodes[i]);
        }
        // Add closing spacer
        codeBlocks.push({
          prams: {
            gate: "closing",
            ast: node,
            type: "SubHeader",
          },
          type: "SubHeader",
          gate: "closing",
          value: "SubHeader closing",
          ast: node,
        });
      } else {
        throw new Error("Unknown item type in AST");
      }
    }
    codeBlocks.push(
      // PROP_DEF
      {
        type: "ArtificialHeader",
        statements: {
          type: "ArtificialHeader",
          prams: {
            ArtificialHeader_TYPE: "PROP_DEF",
            gate: "opening",
          },
        },
        value: "",
        hoisted: {
          hoist: true,
          group: {
            AND: [["AH_PROP_DEF_opening"]],
          },
          target: { line: 1 },
          lowerPriority: {
            AND: [["PROP_DEF"]],
            OR: [["PROP_DEF"]],
          },
        },
      },
      {
        type: "ArtificialHeader",
        statements: {
          type: "ArtificialHeader",
          prams: {
            ArtificialHeader_TYPE: "PROP_DEF",
            gate: "closing",
          },
        },
        value: "",
        hoisted: {
          hoist: true,
          group: {
            AND: [["AH_PROP_DEF_closing"]],
          },
          target: { line: 1 },
          upperPriority: {
            AND: [["PROP_DEF"]],
            OR: [["PROP_DEF"]],
          },
        },
      },

      // ACTION_DEF
      {
        type: "ArtificialHeader",
        statements: {
          type: "ArtificialHeader",
          prams: {
            ArtificialHeader_TYPE: "ACTION_DEF",
            gate: "opening",
          },
        },
        value: "",
        hoisted: {
          hoist: true,
          group: {
            AND: [["AH_ACTION_DEF_opening"]],
          },
          target: { line: 0 },
          lowerPriority: {
            AND: [["ACTION_DEF"]],
            OR: [["ACTION_DEF"]],
          },
        },
      },
      {
        type: "ArtificialHeader",
        statements: {
          type: "ArtificialHeader",
          prams: {
            ArtificialHeader_TYPE: "ACTION_DEF",
            gate: "closing",
          },
        },
        value: "",
        hoisted: {
          hoist: true,
          group: {
            AND: [["AH_ACTION_DEF_closing"]],
          },
          target: { line: 0 },
          upperPriority: {
            AND: [["ACTION_DEF"]],
            OR: [["ACTION_DEF"]],
          },
        },
      }
    );
    // return codeBlocks.join("\n");
    codeBlocks = embeedingSYS_INS.openEmbeedingsMutliSetting(
      codeBlocks,
      [
        {
          embedLevel: {
            sequence: "at",
            level: "PartialTranspiler",
          },
        },
        {
          embedLevel: {
            sequence: "before",
            level: "postSemanticAnalyzer",
          },
        },
      ],
      "eaither",
      [1, 0]
    );

    return codeBlocks;
  }

  return { transpile };
};

module.exports = { create: createTranspiler };
