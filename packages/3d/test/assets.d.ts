// What Vite hands over for a file imported with `?url`: the address it
// serves the file at. The tests serve three's KTX2 transcoder this way, as
// an app would from its own site.
declare module "three/examples/jsm/libs/basis/basis_transcoder.js?url" {
  const url: string;
  export default url;
}
