let ObjectAnimationSystem_INS = ObjectAnimationSystem();
// we have MyProp prop defined here 
class MyProp extends mixClasses([ObjectAnimationSystem_INS.CORE_3d_PROPSsceneSYS.Prop]){

 console.log("hello world");
    
}
// The opening of the Header with PROP,ABC
// The closing of the Header with PROP,ABC
// The opening of the SubHeader with [object Object]
// The closing of the SubHeader with [object Object]
// using the MyProp prop as Alias name
const Alias = MyProp(params);

let OAS_OBJ = {
  defaultGredientMap: new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]),
    3,
    1,
    THREE.RGBFormat
  ), // default value
  scenes: [
    {
      stayTimeInit: 1000, // default value
      stayTimeEnd: 1000, // default value
      lerpTime: 500, // default value
      backgroundColor: 0x000000, // default value
      PropsDef: [
      ],
      actions: [
      ]
    },
    {
      stayTimeInit: 1000, // default value
      stayTimeEnd: 1000, // default value
      lerpTime: 500, // default value
      backgroundColor: 0x000000, // default value
      PropsDef: [
        Alias
      ],
      actions: [
        // using the abc action
{
        stayTime : STAY_TIME,
        lerpTime : LERP_TIME,
        action : abc
        },

      ]
    }
  ]
};

try {
  ObjectAnimationSystem_INS.main(OAS_OBJ).init(60, true);
} catch (e) {
  console.info("ObjectAnimationSystem_INS with OAS_OBJ successfully deployed");
}