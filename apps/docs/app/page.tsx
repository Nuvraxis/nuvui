import { site } from "../lib/site";

export default function HomePage() {
  return (
    <main>
      <h1>{site.name}</h1>
      <p>{site.description}</p>
      <p>
        The docs aren't written yet. Follow the work on{" "}
        <a href={site.repo}>GitHub</a>.
      </p>
    </main>
  );
}
