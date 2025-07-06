// bassically a template engine and nothing more,  kinda verbose not complex though  as needing to reshape ast partial transpiled code chunks into compaitble strs

function create() {
  function renderTemplate(template, input, context = {}) {
    let result = "";
    for (const element of template) {
      if ("str" in element) {
        result += element.str;
      } else if ("placeholder" in element) {
        const key = JSON.stringify(element.placeholder);
        if (key in input) {
          let values = input[key];
          if (element.preProcessor) {
            values = values.map(element.preProcessor);
          }
          let string = element.toString(values, context);
          if (element.postProcessor) {
            string = element.postProcessor(string);
          }
          result += string;
        } else {
          result += "/*[missing while PST translation at render template]*/";
        }
      } else if ("conditional" in element) {
        const conditionResult = element.conditional.condition(context);
        if (conditionResult && element.template) {
          result += renderTemplate(element.template, input, context);
        }
      }
    }
    return result;
  }
  /*
let ObjectAnimationSystem_INS = ObjectAnimationSystem();
 defining actions props stuff here
 let defaultGredientMap = [new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]),
    3,
    1,
    THREE.RGBFormat
  )]
let OAS_OBJ = {
  defaultGredientMap: defaultGredientMap[0],
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
}

// push to the anim (renderer) pipeline
currentANIM = ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);
  */
  let defaultTemplateRenderer_OBJs = [
    {
      placeholder: ["ACTIONS", "PROPS", "USED_PROPS", "USED_ACTIONS"],
    },
    {
      str: "let defaultGredientMap = [",
    },
    {
      placeholder: ["defaultGredientMap"],
    },
    {
      str: `]
let OAS_OBJ = {
  defaultGredientMap: defaultGredientMap[0],
  scenes: [`,
    },
    {
      placeholder: [
        "stayTimeInit",
        "stayTimeEnd",
        "lerpTime",
        "backgroundColor",
      ],
    },
    {
      str: "PropsDef: [",
    },
    {
      placeholder: ["usedProps"],
    },
    {
      str: `  ],
      actions: [`,
    },
    {
      placeholder: ["usedActions"],
    },
    {
      str: `],
    },
  ],
}

// push to the anim (renderer) pipeline
currentANIM = ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);`,
    },
  ];
  function defaultTemplateRenderer(inps) {
    return renderTemplate(defaultTemplateRenderer_OBJs, inps, {});
  }
  function singleReshape(stat, sessionContext = {}) {
    if (Object.keys(sessionContext).length == 0) {
      sessionContext = {
        ACTIONS: {
          started: false,
          ended: false,
          found: null,
        },
      };
    }
    // console.log(stat.type);
    switch (stat.type) {
      case "ArtificialHeader":
        if (stat.statements.prams.gate === "opening") {
          sessionContext.ACTIONS.started = true;
          console.log(stat);
        }
        break;

      default:
        break;
    }
  }
  function reshapeToInps(PST) {
    let sessionContext = {};
    let inputs = {
      ACTIONS: [],
      PROPS: [],
      USED_PROPS: [],
      USED_ACTIONS: [],
      defaultGredientMap: [],
      stayTimeInit: [],
      stayTimeEnd: [],
      lerpTime: [],
      backgroundColor: [],
      usedProps: [],
      usedActions: [],
      errorsLOGS: [],
    };
    for (let i = 0; i < PST.length; i++) {
      // console.log(PST[i]);
      let r = singleReshape(PST[i], sessionContext) || [];
      for (let j = 0; j < r.length; j++) {
        inputs[r[j].type || "errorsLOGS"].push(
          r[j].data ||
            "undefined data from result of PST translation" + i + ":" + j
        );
        sessionContext = r[j].sessionContext;
      }
    }
    return inputs;
  }
  //PST = Post semantic tree
  function transpile(PST) {
    let inps = reshapeToInps(PST) || {};
    let r = defaultTemplateRenderer(inps);
    return r || "PST err";
  }

  return { transpile };
}
module.exports = { create };
