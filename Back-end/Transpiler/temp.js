class MyProp extends mixClasses([
  ObjectAnimationSystem_INS.CORE_3d_PROPSsceneSYS.Prop,
]) {
  // console.log("hello world");
}

const Alias = new MyProp(params);

const Alias2 = new MyProp(params);

let abc_Use8802613696905612 = {
  stayTime: STAY_TIME,
  lerpTime: LERP_TIME,
  action: abc,
};

let ABC_Use42528174847207834 = {
  stayTime: STAY_TIME,
  lerpTime: LERP_TIME,
  action: ABC,
};

let defaultGredientMap = [];
let OAS_OBJ = {
  defaultGredientMap: defaultGredientMap[0],
  scenes: [],
};

// push to the anim (renderer) pipeline
currentANIM = ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);
