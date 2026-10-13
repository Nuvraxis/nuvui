// What Vite hands over for a file imported with `?url`: the address it
// serves the file at. The tests ask for MapLibre's worker this way.
declare module "maplibre-gl/dist/maplibre-gl-worker.mjs?url" {
  const url: string;
  export default url;
}
