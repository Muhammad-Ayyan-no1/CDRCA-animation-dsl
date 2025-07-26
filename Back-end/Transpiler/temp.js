function createActionDef(statment) {
  let partsSTR = "";
  for (let i = 0; i < statment.prams.parts.length; i++) {
    let part = statment.prams.parts[i];
    partsSTR += `
      propsARR[${PROPStoIndex_MAP[part.propName]}].${part.methodName}(${part.prams})    
      `;
  }
  let fn = `function ${statment.prams.name}(propsARR){
    ${partsSTR}
    }`;

  return fn;
}

class MyProp extends mixClasses([
  ObjectAnimationSystem_INS.CORE_3d_PROPSsceneSYS.Prop,
]) {
  // console.log("hello world");
}

var Alias = new MyProp(params);

var defaultGredientMap = [];
var OAS_OBJ = {
  defaultGredientMap: defaultGredientMap[0],
  scenes: [{ PropsDef: [Alias], actions: [] }],
};

// push to the anim (renderer) pipeline
currentANIM = ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);
