var Alias = new MyProp(params);

var defaultGredientMap = [];
var OAS_OBJ = {
  defaultGredientMap: defaultGredientMap[0],
  scenes: [{ PropsDef: [Alias], actions: [] }],
};

// push to the anim (renderer) pipeline
currentANIM = ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);
