"use client";

import { ModelViewer } from "@nuvui/3d";
import { Badge, Button, ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { useThree } from "@react-three/fiber";
import { type CSSProperties, useEffect, useState } from "react";
import "./product-model.scss";

// What's needed of a part of the model: its material's name and color.
// three's own types say more, and need @types/three.
type Part = {
  material?: { name: string; color?: { set(color: string): unknown } };
};

// A made-up lamp and shop. The colors are the paint's, as a photo's would
// be, and the model is one of the site's.
const paints = [
  { id: "saffron", name: "Saffron", color: "#e5a823" },
  { id: "sage", name: "Sage", color: "#8aa38b" },
  { id: "slate", name: "Slate", color: "#4b5563" },
];

const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Drawn in the viewer's scene: it finds the shade's material by its name
// in the model and paints it.
function ShadePaint({ color }: { color: string }) {
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    scene.traverse((child) => {
      const { material } = child as unknown as Part;
      if (material?.name === "Shade paint") material.color?.set(color);
    });
    invalidate();
  }, [scene, color, invalidate]);

  return null;
}

export default function ProductModel() {
  const [paint, setPaint] = useState(paints[0]?.id ?? "");
  const chosen = paints.find((item) => item.id === paint) ?? paints[0];

  return (
    <div className="product-model">
      <nav className="product-model__trail" aria-label="Breadcrumb">
        <a href="#lighting">Lighting</a>
        <span aria-hidden="true">/</span>
        <a href="#desk">Desk lamps</a>
      </nav>

      <div className="product-model__body">
        <ModelViewer
          className="product-model__viewer"
          label={`Arc desk lamp, ${chosen?.name ?? ""} shade`}
          description="A desk lamp with a round weighted base, an upright arm and an arm reaching out to a cone-shaped shade."
          src="/models/lamp.glb"
          poster="/models/lamp.webp"
        >
          {chosen && <ShadePaint color={chosen.color} />}
        </ModelViewer>

        <div className="product-model__details">
          <div className="product-model__heading">
            <Badge intent="success">In stock</Badge>
            <h1 className="product-model__title">Arc desk lamp</h1>
            <p className="product-model__price">{price.format(129)}</p>
          </div>

          <p className="product-model__lead">
            A steel arm that reaches over the desk, on a base heavy enough not
            to tip. Turn it to see it from every side.
          </p>

          <div className="product-model__field">
            <p className="product-model__label" id="product-model-paint">
              Shade: {chosen?.name}
            </p>
            <ToggleGroup
              type="single"
              aria-labelledby="product-model-paint"
              value={paint}
              onValueChange={(value) => value && setPaint(value)}
            >
              {paints.map((item) => (
                <ToggleGroupItem
                  key={item.id}
                  value={item.id}
                  className="product-model__paint"
                  style={
                    { "--product-model-swatch": item.color } as CSSProperties
                  }
                >
                  <span className="product-model__swatch" aria-hidden="true" />
                  {item.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <Button size="lg" className="product-model__buy">
            Add to cart
          </Button>

          <dl className="product-model__specs">
            <div className="product-model__spec">
              <dt>Height</dt>
              <dd>37 cm</dd>
            </div>
            <div className="product-model__spec">
              <dt>Reach</dt>
              <dd>45 cm</dd>
            </div>
            <div className="product-model__spec">
              <dt>Base</dt>
              <dd>22 cm across</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
