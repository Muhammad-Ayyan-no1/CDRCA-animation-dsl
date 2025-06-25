// Initialize the scene, camera, and renderer
const FPS = 60;
const DeltaFrame = 1 / FPS;
let totalFrames = 0;
let ObjectsOverTime = [
  {
    lerpTime: 5, // ms
    stayTime: 1000 * DeltaFrame,
    Objects: [
      {
        Geometry: new THREE.BoxGeometry(),
        Material: new THREE.MeshToonMaterial({ color: 0x00ff00 }),
        outline: {
          render: true,
          color: 0x00ff00,
          opacity: 0.5,
        },
        createMesh: true,
        // code which can edit stuff   (js)
        modifier: {
          geometry: ``,
          material: ``,
          mesh: `mesh.rotation.x += totalFrames * DeltaFrame;
          mesh.rotation.y += totalFrames * DeltaFrame;
          console.log(step)`,
        },
      },
    ],
  },
];
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();

// Set up the renderer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a directional light for toon shading
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// // Create a simple cube as our first object with toon material
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshToonMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

let currentOOT = 0;
function runmodifier(modifier, prams, defaultReturn) {
  return new Function(`function (){
     function main(${prams.join(",")}){
${modifier}
return ${defaultReturn}
        }
return main
        }`)();
}
function addOutlineToMesh(mesh, color, opacity) {
  // Ensure color is a number (handles "0x000000" or "#000000" or 0x000000)
  let parsedColor = color;
  if (typeof color === "string") {
    if (color.startsWith("0x")) {
      parsedColor = parseInt(color, 16);
    } else if (color.startsWith("#")) {
      parsedColor = color;
    }
  }

  // Fallback if geometry is missing
  if (!mesh.geometry) return mesh;

  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: parsedColor,
    side: THREE.BackSide,
    transparent: opacity < 1,
    opacity: opacity,
    depthWrite: false,
  });

  const outlineMesh = new THREE.Mesh(mesh.geometry.clone(), outlineMaterial);
  outlineMesh.position.copy(mesh.position);
  outlineMesh.rotation.copy(mesh.rotation);
  outlineMesh.scale.copy(mesh.scale).multiplyScalar(1.05);

  mesh.add(outlineMesh);

  return mesh;
}
function getOBJmesh(obj) {
  let mesh = (function () {
    if (obj.createMesh) {
      if (obj.modifier.Geometry && obj.modifier.Geometry != "") {
        obj.Geometry = runmodifier(
          obj.modifier.Geometry,
          ["Geometry", "Material", "step"],
          "Geometry"
        )(obj.Geometry, obj.Material, 0);
      }
      if (obj.modifier.Material && obj.modifier.Material != "") {
        obj.Material = runmodifier(
          obj.modifier.Material,
          ["Geometry", "Material", "step"],
          "Material"
        )(obj.Geometry, obj.Material, 0);
      }
      return new THREE.Mesh(obj.Geometry, obj.Material);
    } else {
      if (obj.modifier.Mesh && obj.modifier.Mesh != "") {
        obj.Mesh = runmodifier(
          obj.modifier.Mesh,
          ["Mesh", "step"],
          "Mesh"
        )(obj.Mesh, 0);
      }
      return obj.Mesh;
    }
  })();
  if (obj.modifier.Mesh && obj.modifier.Mesh != "") {
    mesh = runmodifier(obj.modifier.Mesh, ["Mesh", "step"], "Mesh")(mesh, 1);
  }
  if (obj.outline && obj.outline.render) {
    mesh = addOutlineToMesh(mesh, obj.outline.color, obj.outline.opacity);
  }
  return mesh;
}
// TODO   idk how id do smooth lerping / morphing
function lerpNewOOT() {}
let hasOOTinc = false;
function updateScene() {
  scene.clear();
  let objs = ObjectsOverTime[currentOOT].Objects;
  for (let i = 0; i < objs.length; i++) {
    let mesh = getOBJmesh(objs[i]);
    scene.add(mesh);
  }
  if (!hasOOTinc && ObjectsOverTime[currentOOT + 1])
    setTimeout(() => {
      currentOOT++;
      hasOOTinc = true;
    }, ObjectsOverTime[currentOOT].stayTime);
}

// Position the camera
camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  totalFrames += 1;
  updateScene();
  renderer.render(scene, camera);
}

// Start the animation
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
