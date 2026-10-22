import core from "@nuvui/react/package.json" with { type: "json" };
import { browserTests } from "@nuvui/tooling/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(
  browserTests({
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
  }),
  {
    test: {
      // A CI runner has no graphics card, so WebGL is drawn on its two
      // cores while three browsers share them. There the first model a
      // test loads has taken 12 seconds in WebKit and more than Vitest's
      // 15 in Chromium. A test gets longer than the 45 seconds it waits
      // for a model, so a slow load fails by that wait and says so.
      testTimeout: 60_000,
    },
  },
);
