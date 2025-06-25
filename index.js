let CORE_3dFramesRenderer = function (
  FPS,
  loopAtEnd,
  ObjectsOverTime,
  gradientMap
) {
  //   const FPS = 60;
  const DeltaFrame = 1 / FPS;
  let totalFrames = 0;
  let currentOOT = 0;
  let currentStartTime = 0;

  //   let loopAtEnd = false;

  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;

  //   let ObjectsOverTime = [
  //     {
  //       lerpTime: 500, // ms
  //       stayTime: 2000, // ms
  //       backgroundColor: 0x000000, // Black
  //       Objects: [
  //         {
  //           Geometry: new THREE.BoxGeometry(),
  //           Material: (function () {
  //             const material = new THREE.MeshToonMaterial({ color: 0x00ff00 });
  //             material.gradientMap = gradientMap;
  //             return material;
  //           })(),
  //           outline: {
  //             render: true,
  //             color: 0x00ff00,
  //             opacity: 0.5,
  //           },
  //           createMesh: true,
  //           modifier: {
  //             geometry: ``,
  //             material: ``,
  //             mesh: `mesh.rotation.x = totalTime * 1;
  // mesh.rotation.y = totalTime * 1;`,
  //           },
  //         },
  //       ],
  //     },
  //     {
  //       lerpTime: 500,
  //       stayTime: 2000,
  //       backgroundColor: 0x1a1a1a, // Dark gray
  //       Objects: [
  //         {
  //           Geometry: new THREE.SphereGeometry(0.7, 32, 32),
  //           Material: (function () {
  //             const material = new THREE.MeshToonMaterial({ color: 0xff0000 });
  //             material.gradientMap = gradientMap;
  //             return material;
  //           })(),
  //           outline: {
  //             render: true,
  //             color: 0xffff00,
  //             opacity: 0.5,
  //           },
  //           createMesh: true,
  //           modifier: {
  //             mesh: `mesh.position.y = Math.sin(totalTime) * 1;
  // mesh.rotation.z = totalTime * 1.5;`,
  //           },
  //         },
  //       ],
  //     },
  //   ];

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

  // Add lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  light.target = new THREE.Object3D();
  light.target.position.set(0, 0, 0);
  scene.add(light);
  scene.add(light.target);
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  camera.position.z = 5;

  function runmodifier(modifier, params, defaultReturn) {
    return new Function(`
    return function main(${params.join(",")}) {
        ${modifier}
        return ${defaultReturn}
    }
`)();
  }

  function addOutlineToMesh(mesh, color, opacity) {
    let parsedColor = color;
    if (typeof color === "string" && color.startsWith("#")) {
      parsedColor = color;
    } else if (typeof color === "number") {
      parsedColor = `#${color.toString(16).padStart(6, "0")}`;
    }

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: parsedColor,
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
      if (obj.modifier.material && obj.modifier.material !== "") {
        material = runmodifier(
          obj.modifier.material,
          ["geometry", "material", "totalTime", "lerpProgress", "step"],
          "material"
        )(geometry, material, totalTime, lerpProgress, step);
      }
      mesh = new THREE.Mesh(geometry, material);
    } else {
      mesh = obj.Mesh;
      if (obj.modifier.mesh && obj.modifier.mesh !== "") {
        mesh = runmodifier(
          obj.modifier.mesh,
          ["mesh", "totalTime", "lerpProgress", "step"],
          "mesh"
        )(mesh, totalTime, lerpProgress, step);
      }
    }
    if (obj.modifier.mesh && obj.modifier.mesh !== "") {
      mesh = runmodifier(
        obj.modifier.mesh,
        ["mesh", "totalTime", "lerpProgress", "step"],
        "mesh"
      )(mesh, totalTime, lerpProgress, step);
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
    let objs = ObjectsOverTime[currentOOT].Objects;
    for (let i = 0; i < objs.length; i++) {
      let mesh = getOBJmesh(objs[i], totalTime, lerpProgress, 1);
      scene.add(mesh);
    }
  }

  // Animation loop

  function animate(timestamp) {
    // this code was updated by gpt 4.1
    requestAnimationFrame(animate);
    totalFrames += 1;
    if (currentStartTime === 0) currentStartTime = timestamp;

    let elapsed = timestamp - currentStartTime;
    let currentEntry = ObjectsOverTime[currentOOT];

    // Advance OOT if needed (handles multiple skips if tab was inactive)
    while (elapsed >= currentEntry.lerpTime + currentEntry.stayTime) {
      if (loopAtEnd) {
        currentOOT = (currentOOT + 1) % ObjectsOverTime.length;
      } else {
        if (currentOOT < ObjectsOverTime.length - 1) {
          currentOOT += 1;
        } else {
          // Stay at the last entry   or do events in future
          break;
        }
      }
      currentStartTime += currentEntry.lerpTime + currentEntry.stayTime;
      elapsed = timestamp - currentStartTime;
      currentEntry = ObjectsOverTime[currentOOT];
    }

    const totalTime = timestamp / 1000; // in seconds
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

  animate(0);

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};
const gradientMap = new THREE.DataTexture(
  new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]),
  3,
  1,
  THREE.RGBFormat
);
let ObjectsOverTime = [
  {
    lerpTime: 500, // ms
    stayTime: 2000, // ms
    backgroundColor: 0x000000, // Black
    Objects: [
      {
        Geometry: new THREE.BoxGeometry(),
        Material: (function () {
          const material = new THREE.MeshToonMaterial({ color: 0x00ff00 });
          material.gradientMap = gradientMap;
          return material;
        })(),
        outline: {
          render: true,
          color: 0x00ff00,
          opacity: 0.5,
        },
        createMesh: true,
        modifier: {
          geometry: ``,
          material: ``,
          mesh: `mesh.rotation.x = totalTime * 1;
mesh.rotation.y = totalTime * 1;`,
        },
      },
    ],
  },
  {
    lerpTime: 500,
    stayTime: 2000,
    backgroundColor: 0x1a1a1a, // Dark gray
    Objects: [
      {
        Geometry: new THREE.SphereGeometry(0.7, 32, 32),
        Material: (function () {
          const material = new THREE.MeshToonMaterial({ color: 0xff0000 });
          material.gradientMap = gradientMap;
          return material;
        })(),
        outline: {
          render: true,
          color: 0xffff00,
          opacity: 0.5,
        },
        createMesh: true,
        modifier: {
          mesh: `mesh.position.y = Math.sin(totalTime) * 1;
mesh.rotation.z = totalTime * 1.5;`,
        },
      },
    ],
  },
];

CORE_3dFramesRenderer(60, true, ObjectsOverTime, gradientMap);
