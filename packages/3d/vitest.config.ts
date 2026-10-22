import core from "@nuvui/react/package.json" with { type: "json" };
import { browserTests } from "@nuvui/tooling/vitest";

export default browserTests({
  dependencies: [
    // What @nuvui/react imports. It's linked from the workspace, so Vite
    // treats it as source and would otherwise find these one at a time
    // while the tests are already running.
    ...Object.keys(core.dependencies).map((name) => `@nuvui/react > ${name}`),
    "three",
    "@react-three/fiber",
    "three/addons/controls/OrbitControls.js",
    "three/addons/environments/RoomEnvironment.js",
    "three/addons/loaders/GLTFLoader.js",
    "three/addons/loaders/STLLoader.js",
    "three/addons/loaders/KTX2Loader.js",
    "three/addons/libs/meshopt_decoder.module.js",
    "react-dom/server",
  ],
});
