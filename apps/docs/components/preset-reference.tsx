import { createTheme, presetNames, presets } from "@nuvui/theme";

// Read from the same list the package's build writes its theme files from,
// so the table can't name a preset that doesn't ship or miss one that does.
export function PresetList() {
  return (
    <section
      className="relative my-6 overflow-auto prose-no-margin"
      aria-label="Presets"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: on a phone this box scrolls sideways, and a scrollable area has to be reachable by keyboard
      tabIndex={0}
    >
      <table className="min-w-xl">
        <thead>
          <tr>
            <th scope="col">Preset</th>
            <th scope="col">Brand</th>
            <th scope="col">Base</th>
            <th scope="col">Radius</th>
            <th scope="col">Density</th>
            <th scope="col">Contrast</th>
          </tr>
        </thead>
        <tbody>
          {presetNames.map((name) => {
            const choice = presets[name];
            const { light } = createTheme(choice);
            return (
              <tr key={name} data-preset-row={name}>
                <th scope="row">
                  <code className="whitespace-nowrap">{name}</code>
                </th>
                <td className="whitespace-nowrap">
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block size-4 rounded-sm border align-middle"
                    style={{ backgroundColor: light["--color-primary"] }}
                  />
                  {choice.brand}
                </td>
                <td>{choice.base}</td>
                <td>{choice.radius}</td>
                <td>{choice.density}</td>
                <td>{choice.contrast}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
