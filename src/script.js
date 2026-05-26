import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as dat from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Models
 * When loading a model, always check the structure of the model by logging the gltf object
 * Check what the model contains, like the meshes, materials, textures, cameras, etc.
 * Also important to check the scale of the model, because it can be very big or quite small
 */
/**
 * There are multiple ways to add a model to the scene:
 * 1. Add the whole scene inside of the model to the Three.JS scene. This will add the everything inside of the model.
 * 2. Add the children of the scene inside of the model to the Three.JS scene. This will add the scale, cameras and anything else inside of the children of the scene.
 * 3. Filter the children before adding to the scene. Can be hard to do, because the model can have many children.
 * 4. Add only the mesh. This will not add the scale, since they are included in the parents.
 * 5. Clean the file in a 3D modelling software and remove everything you don't need. This will make the file smaller and faster to load.
 */
// The dracoLoader will only be loaded and used if it's needed when a model needs it.
const dracoLoader = new DRACOLoader()
// setDecoderPath is optional, but recommended for performance reasons. It will use the webAssembly version of draco and another thread / core to do the work.
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
gltfLoader.load(
    // Duck
//   "/models/Duck/glTF/Duck.gltf", // Default format
//   "/models/Duck/glTF-Binary/Duck.glb", // Binary format
//   "/models/Duck/glTF-Draco/Duck.gltf", // Draco format
//   "/models/Duck/glTF-Embedded/Duck.gltf", // Embedded format

    // FlightHelmet
    // "/models/FlightHelmet/glTF/FlightHelmet.gltf",

    // Fox
    "/models/Fox/glTF/Fox.gltf",
  (gltf) => {
    console.log("success");
    console.log(gltf);
    // scene.add(gltf.scene.children[0]) // Duck

    /**
     * FlightHelmet
     * The FlightHelmet model contains many meshes, so we need to loop through them and add them all to the scene
     * When looping, the loader grabs a mesh from the model array. That mesh then gets removed from the model array. Thus a traditional for loop won't work (Mesh 1 will become 0 and Mesh 2 will become 1, etc.)
     * A while loop will work, because it will keep looping until the model is empty.
     */
    // OPTION 1: While loop
    // while (gltf.scene.children.length > 0)
    // {
    //     scene.add(gltf.scene.children[0])
    // }

    // OPTION 2: For loop from a new array (this way, the meshes won't be removed from the array)
    // Take the values of the array and add them to the new children array
    // const children = [...gltf.scene.children]
    // for (const child of children)
    // {
    //     scene.add(child)
    // }

    // Animation mixer
    mixer = new THREE.AnimationMixer(gltf.scene)
    const action = mixer.clipAction(gltf.animations[2])
    action.play()

    gltf.scene.scale.set(0.025, 0.025, 0.025)
    scene.add(gltf.scene)
  },
  (progress) => {
    console.log("progress");
  },
  (error) => {
    console.log("error");
  },
);

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: "#444444",
    metalness: 0,
    roughness: 0.5,
  }),
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(2, 2, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update mixer
  if (mixer !== null)
  {
    mixer.update(deltaTime)
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
