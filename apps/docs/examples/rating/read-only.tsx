import { Rating } from "@nuvui/react";

const products = [
  { name: "Standing desk", average: 4.5, reviews: 128 },
  { name: "Monitor arm", average: 3.7, reviews: 64 },
  { name: "Cable tray", average: 2, reviews: 9 },
];

export default function Example() {
  return (
    <ul
      style={{
        display: "grid",
        gap: 12,
        margin: 0,
        padding: 0,
        listStyle: "none",
      }}
    >
      {products.map((product) => (
        <li
          key={product.name}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <span style={{ inlineSize: "8rem" }}>{product.name}</span>
          <Rating readOnly size="sm" value={product.average} />
          <span>
            {product.average} ({product.reviews})
          </span>
        </li>
      ))}
    </ul>
  );
}
