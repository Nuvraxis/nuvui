// Tests import the SCSS source so components render with their real styles.
// Vite handles the import. This only tells TypeScript the files exist.
declare module "*.scss";

// An add-on's tests also import the core's built stylesheet.
declare module "*.css";
