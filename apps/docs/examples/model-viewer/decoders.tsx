import { ModelViewer } from "@nuvui/3d";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
        inlineSize: "100%",
      }}
    >
      {/* Meshopt's decoder is in three, with nothing to serve. */}
      <ModelViewer
        label="Oak chair, compressed with Meshopt"
        src="/docs/models/chair-meshopt.glb"
        decoders={{ meshopt: true }}
      />
      {/* KTX2's transcoder is two files the site serves, from the three
          it has installed. */}
      <ModelViewer
        label="Pine crate, with a KTX2 texture"
        src="/docs/models/crate-ktx2.glb"
        decoders={{ ktx2: "/docs/basis/" }}
      />
    </div>
  );
}
