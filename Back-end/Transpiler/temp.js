class MyProp extends mixClasses([
  ObjectAnimationSystem_INS.CORE_3d_PROPSsceneSYS.Prop,
]) {
  // console.log("hello world");
}

const Alias = new MyProp(params);

let abc_Use21028708049871203 = {
  stayTime: STAY_TIME,
  lerpTime: LERP_TIME,
  action: abc,
};

let defaultGredientMap = [];
let OAS_OBJ = {
  defaultGredientMap: defaultGredientMap[0],
  scenes: [{ PropsDef: [Alias], actions: [abc_Use21028708049871203] }],
};

// push to the anim (renderer) pipeline
currentANIM = ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);
