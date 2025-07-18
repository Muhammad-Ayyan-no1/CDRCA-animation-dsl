function ACTION_ACTION_NAME(
  PropsARR,
  preFN,
  postFN,
  btweenFNpre,
  btweenFNpost
) {
  const inpPrams = [PropsARR, preFN, postFN, btweenFNpre, btweenFNpost];
  preFN(inpPrams);
  var prop;
  var prams = [];

  ((prop = PropsARR[Number(undefined) || 0]),
    (prams = [
      inpPrams,
      0,
      undefined,
      "PROP_NAME",
      "METHOD_NAME",
      prop,
      undefined,
    ]));

  btweenFNpre(prams);
  prop.METHOD_NAME(undefined);
  btweenFNpost(prams);
}
postFN(inpPrams);

class MyProp extends mixClasses([
  ObjectAnimationSystem_INS.CORE_3d_PROPSsceneSYS.Prop,
]) {}

var Alias = new MyProp(params);

var MyActionInstance = {
  stayTime: STAY_TIME,
  lerpTime: LERP_TIME,
  action: abc,
};

var defaultGredientMap = [];
var OAS_OBJ = {
  defaultGredientMap: defaultGredientMap[0],
  scenes: [{ PropsDef: [Alias], actions: [MyActionInstance] }],
};

// push to the anim (renderer) pipeline
currentANIM = ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);
