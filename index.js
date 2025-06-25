// Core renderer dont edit
function CORE_3dFramesRenderer(FPS, loopAtEnd, ObjectsOverTime, gradientMap) {
  const DeltaFrame = 1 / FPS;
  let totalFrames = 0;
  let currentOOT = 0;
  let currentStartTime = 0;

  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);
  scene.add(light.target);
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  camera.position.z = 5;

  function runmodifier(modifier, params, defaultReturn) {
    return new Function(
      `return function main(${params.join(
        ","
      )}) { ${modifier}; return ${defaultReturn} }`
    )();
  }

  function addOutlineToMesh(mesh, color, opacity) {
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.BackSide,
      transparent: opacity < 1,
      opacity: opacity,
      depthWrite: false,
    });
    const outlineMesh = new THREE.Mesh(mesh.geometry.clone(), outlineMaterial);
    outlineMesh.scale.multiplyScalar(1.05);
    mesh.add(outlineMesh);
    return mesh;
  }

  function getOBJmesh(obj, totalTime, lerpProgress, step) {
    let mesh;
    if (obj.createMesh) {
      let geometry = obj.Geometry;
      let material = obj.Material.clone();
      if (obj.modifier.geometry && obj.modifier.geometry !== "") {
        geometry = runmodifier(
          obj.modifier.geometry,
          ["geometry", "material", "totalTime", "lerpProgress", "step"],
          "geometry"
        )(geometry, material, totalTime, lerpProgress, step);
      }
      mesh = new THREE.Mesh(geometry, material);
    } else {
      mesh = obj.Mesh;
    }
    if (obj.modifier.mesh) {
      if (typeof obj.modifier.mesh === "function") {
        mesh = obj.modifier.mesh(mesh, totalTime, lerpProgress, step);
      } else if (obj.modifier.mesh !== "") {
        mesh = runmodifier(
          obj.modifier.mesh,
          ["mesh", "totalTime", "lerpProgress", "step"],
          "mesh"
        )(mesh, totalTime, lerpProgress, step);
      }
    }
    if (obj.outline && obj.outline.render) {
      mesh = addOutlineToMesh(
        mesh,
        obj.outline.color,
        obj.outline.opacity * lerpProgress
      );
    }
    if (mesh.material) {
      mesh.material.transparent = true;
      mesh.material.opacity = lerpProgress;
    }
    return mesh;
  }

  function updateScene(totalTime, lerpProgress) {
    scene.clear();
    scene.add(light);
    scene.add(light.target);
    scene.add(ambientLight);
    renderer.setClearColor(ObjectsOverTime[currentOOT].backgroundColor);
    const objs = ObjectsOverTime[currentOOT].Objects;
    for (let i = 0; i < objs.length; i++) {
      scene.add(getOBJmesh(objs[i], totalTime, lerpProgress, 1));
    }
  }

  function animate(timestamp) {
    requestAnimationFrame(animate);
    totalFrames += 1;
    if (currentStartTime === 0) currentStartTime = timestamp;

    let elapsed = timestamp - currentStartTime;
    let currentEntry = ObjectsOverTime[currentOOT];

    while (elapsed >= currentEntry.lerpTime + currentEntry.stayTime) {
      if (loopAtEnd) {
        currentOOT = (currentOOT + 1) % ObjectsOverTime.length;
      } else if (currentOOT < ObjectsOverTime.length - 1) {
        currentOOT += 1;
      } else {
        break;
      }
      currentStartTime += currentEntry.lerpTime + currentEntry.stayTime;
      elapsed = timestamp - currentStartTime;
      currentEntry = ObjectsOverTime[currentOOT];
    }

    const totalTime = timestamp / 1000;
    let lerpProgress = 1;
    if (elapsed < currentEntry.lerpTime) {
      lerpProgress = THREE.MathUtils.lerp(
        0,
        1,
        elapsed / currentEntry.lerpTime
      );
    }
    updateScene(totalTime, lerpProgress);
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    goToNextOOT: () => currentOOT++,
    init: () => animate(0),
  };
}

const ThreeJsSceneSystem = (function () {
  class Prop {
    getObjectConfig() {
      throw new Error("getObjectConfig must be implemented");
    }
    modifyMesh(mesh, totalTime, lerpProgress, step) {
      return mesh;
    }
  }

  class RotatingCubeProp extends Prop {
    constructor(color, rotationSpeed) {
      super();
      this.color = color;
      this.rotationSpeed = rotationSpeed;
    }
    modifyMesh(mesh, totalTime) {
      mesh.rotation.x = totalTime * this.rotationSpeed;
      mesh.rotation.y = totalTime * this.rotationSpeed;
      return mesh;
    }
    getObjectConfig() {
      return {
        Geometry: new THREE.BoxGeometry(),
        Material: (() => {
          const material = new THREE.MeshToonMaterial({ color: this.color });
          material.gradientMap = this.gradientMap;
          return material;
        })(),
        outline: { render: true, color: this.color, opacity: 0.5 },
        createMesh: true,
        modifier: { mesh: this.modifyMesh.bind(this) },
      };
    }
  }

  class BouncingSphereProp extends Prop {
    modifyMesh(mesh, totalTime) {
      mesh.position.y = Math.sin(totalTime) * 1;
      mesh.rotation.z = totalTime * 1.5;
      return mesh;
    }
    getObjectConfig() {
      return {
        Geometry: new THREE.SphereGeometry(0.7, 32, 32),
        Material: (() => {
          const material = new THREE.MeshToonMaterial({ color: 0xff0000 });
          material.gradientMap = this.gradientMap;
          return material;
        })(),
        outline: { render: true, color: 0xffff00, opacity: 0.5 },
        createMesh: true,
        modifier: { mesh: this.modifyMesh.bind(this) },
      };
    }
  }

  class Scene {
    constructor(lerpTime, stayTime, backgroundColor, props) {
      this.lerpTime = lerpTime;
      this.stayTime = stayTime;
      this.backgroundColor = backgroundColor;
      this.props = props;
    }
    getConfig() {
      return {
        lerpTime: this.lerpTime,
        stayTime: this.stayTime,
        backgroundColor: this.backgroundColor,
        Objects: this.props.map((prop) => prop.getObjectConfig()),
      };
    }
  }

  // Public API
  return {
    Prop,
    RotatingCubeProp,
    BouncingSphereProp,
    Scene,
    init(FPS, loopAtEnd, scenes, gradientMap) {
      const objectsOverTime = scenes.map((scene) => scene.getConfig());
      const renderer = CORE_3dFramesRenderer(
        FPS,
        loopAtEnd,
        objectsOverTime,
        gradientMap
      );
      renderer.init();
      return renderer;
    },
  };
})();

// Usage
const gradientMap = new THREE.DataTexture(
  new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]),
  3,
  1,
  THREE.RGBFormat
);
const greenCube = new ThreeJsSceneSystem.RotatingCubeProp(0x00ff00, 1);
const redSphere = new ThreeJsSceneSystem.BouncingSphereProp();
const scene1 = new ThreeJsSceneSystem.Scene(500, 2000, 0x000000, [greenCube]);
const scene2 = new ThreeJsSceneSystem.Scene(500, 2000, 0x1a1a1a, [redSphere]);
greenCube.gradientMap = gradientMap; // Ensure gradientMap is passed to props
redSphere.gradientMap = gradientMap;
ThreeJsSceneSystem.init(60, true, [scene1, scene2], gradientMap);
