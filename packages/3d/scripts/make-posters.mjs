// Draws a poster of each GLB model in a folder, as the viewer first shows
// it: the same camera, the same light, on a clear background. They're
// drawn with three in Chromium, through Playwright, and written as WebP
// beside the models.
//
//   node packages/3d/scripts/make-posters.mjs <folder of models>
//
// STL models get no poster: the viewer draws them in the theme's color,
// which a picture can't follow.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join, normalize } from "node:path";

const folder = process.argv[2];
if (!folder) throw new Error("Say which folder the models are in.");

const require = createRequire(import.meta.url);
const three = join(dirname(require.resolve("three")), "..");
const { chromium } = require("playwright");

const width = 960;
const height = 720;

const page = `<!doctype html>
<script type="importmap">
  { "imports": { "three": "/three/build/three.module.js", "three/addons/": "/three/examples/jsm/" } }
</script>
<script type="module">
  import * as THREE from "three";
  import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
  import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(${width}, ${height});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.append(renderer.domElement);

  const scene = new THREE.Scene();
  const generator = new THREE.PMREMGenerator(renderer);
  scene.environment = generator.fromScene(new RoomEnvironment(), 0.04).texture;
  // The viewer's light: from all round, from below in a muted grey, and
  // one from above and in front.
  scene.add(new THREE.HemisphereLight(0xffffff, new THREE.Color().setRGB(0.89, 0.89, 0.91, THREE.SRGBColorSpace), 0.3));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  // The viewer's framing, from packages/3d/src/core/frame.ts.
  const fov = 40;
  const camera = new THREE.PerspectiveCamera(fov, ${width} / ${height});

  window.render = async (url) => {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const vertical = (fov * Math.PI) / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    const fit = (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.08;
    const theta = (30 * Math.PI) / 180;
    const phi = Math.PI / 2 - (15 * Math.PI) / 180;
    camera.position.set(
      fit * Math.sin(phi) * Math.sin(theta),
      fit * Math.cos(phi),
      fit * Math.sin(phi) * Math.cos(theta),
    );
    camera.near = Math.max(radius / 100, (fit - radius) / 50);
    camera.far = fit * 4 + radius * 2;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    scene.add(model);
    renderer.render(scene, camera);
    const picture = renderer.domElement.toDataURL("image/webp", 0.9);
    scene.remove(model);
    return picture;
  };
  window.ready = true;
</script>`;

const types = {
  ".js": "text/javascript",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".png": "image/png",
};

const server = createServer((request, response) => {
  const url = decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/");
  let file;
  if (url === "/") {
    response.writeHead(200, { "content-type": "text/html" });
    response.end(page);
    return;
  }
  if (url.startsWith("/three/")) file = join(three, normalize(url.slice(7)));
  else if (url.startsWith("/models/"))
    file = join(folder, normalize(url.slice(8)));
  try {
    const bytes = readFileSync(file ?? "");
    response.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
    });
    response.end(bytes);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ viewport: { width, height } });
  tab.on("pageerror", (error) => console.error(error.message));
  await tab.goto(`http://127.0.0.1:${port}/`);
  await tab.waitForFunction(() => window.ready === true);
  for (const name of readdirSync(folder).filter((file) =>
    file.endsWith(".glb"),
  )) {
    // A compressed copy looks the same as its plain one.
    if (/-(meshopt|ktx2)\.glb$/.test(name)) continue;
    const picture = await tab.evaluate(
      (url) => window.render(url),
      `/models/${name}`,
    );
    const out = join(folder, name.replace(/\.glb$/, ".webp"));
    writeFileSync(out, Buffer.from(picture.split(",")[1], "base64"));
    console.log(`make-posters: ${out}`);
  }
} finally {
  await browser.close();
  server.close();
}
