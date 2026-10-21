# @nuvui/date-picker

## 0.1.8

### Patch Changes

- Updated dependencies [[`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944)]:
  - @nuvui/react@0.8.0

## 0.1.7

### Patch Changes

- Updated dependencies [[`edff9a4`](https://github.com/Nuvraxis/nuvui/commit/edff9a4b8620d36176a4875fad6e00e6b53c121d)]:
  - @nuvui/react@0.7.0

## 0.1.6

### Patch Changes

- Updated dependencies [[`15bf3c3`](https://github.com/Nuvraxis/nuvui/commit/15bf3c38570b5b1952dcadc34f90c39ae9fdc592)]:
  - @nuvui/react@0.6.0

## 0.1.5

### Patch Changes

- Updated dependencies [[`0fc08bc`](https://github.com/Nuvraxis/nuvui/commit/0fc08bc21adea0d24f54ef688a3575243d4694a3)]:
  - @nuvui/react@0.5.0

## 0.1.4

### Patch Changes

- [#47](https://github.com/Nuvraxis/nuvui/pull/47) [`11890f4`](https://github.com/Nuvraxis/nuvui/commit/11890f422f7d2844a4aebb3e60f6fd1311432a80) Thanks [@sajanv88](https://github.com/sajanv88)! - Mirroring for right-to-left pages now works in a Next.js build.
  
  - What has to be mirrored where a page reads right to left was written with `:dir(rtl)`: the arrows of Breadcrumb, Pagination, Tree, submenus and the data table, the side a Sheet and a Sidebar slide in from, the bars of Progress and HoldToConfirm, the sweep of TextShimmer and the ends of a range in Calendar. A build that supports browsers without `:dir()`, which is Next.js by default, rewrites that to a list of `:lang()` selectors, so none of it was mirrored on a page that set `dir="rtl"` without one of those languages. These rules now go by the `dir` attribute, on the element or around it. That also works in Chrome before 120, which has no `:dir()`.
  - A new `rtl` mixin in `@nuvui/react/scss/mixins` writes the same selector for your own styles.
- Updated dependencies [[`a533ceb`](https://github.com/Nuvraxis/nuvui/commit/a533ceb07066fbf4324af1e59a47bbe1a3022605), [`54da14b`](https://github.com/Nuvraxis/nuvui/commit/54da14bad36f5cb70aabfed872e55bfbf6a9ea3e), [`c473abb`](https://github.com/Nuvraxis/nuvui/commit/c473abba2b75289298fde9f901f712dda2be3f53), [`baa088b`](https://github.com/Nuvraxis/nuvui/commit/baa088b5070cf8fbec4c1517652c4da94b6aeb53), [`11890f4`](https://github.com/Nuvraxis/nuvui/commit/11890f422f7d2844a4aebb3e60f6fd1311432a80), [`4e67dd6`](https://github.com/Nuvraxis/nuvui/commit/4e67dd6368fb7914f4df6d75de10c3f67d631adc)]:
  - @nuvui/react@0.4.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`1d694d4`](https://github.com/Nuvraxis/nuvui/commit/1d694d4ea838cd27ee5d728a786365adabadcc8e), [`ed5ade6`](https://github.com/Nuvraxis/nuvui/commit/ed5ade6f5f81978aab12cc6babaa6cb916cf6b1b), [`078bb29`](https://github.com/Nuvraxis/nuvui/commit/078bb29c3fa15fc7a65c7d6a1075e46b87ee0744)]:
  - @nuvui/react@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`adfcd97`](https://github.com/Nuvraxis/nuvui/commit/adfcd978c029bfa747be1d3ca2952d4b8df5d409), [`5489f1e`](https://github.com/Nuvraxis/nuvui/commit/5489f1e191c9ad8325e26c0c03fdf9b81c56f74a)]:
  - @nuvui/react@0.2.0

## 0.1.1

### Patch Changes

- [#26](https://github.com/Nuvraxis/nuvui/pull/26) [`3e9922d`](https://github.com/Nuvraxis/nuvui/commit/3e9922d8100e8fba75ae5cc354d8d79fb00bfdf1) Thanks [@sajanv88](https://github.com/sajanv88)! - Each package's README said the package hadn't been released and that the docs would live at nuvui.nuvraxis.com. It now gives the install command and links to the docs, which are there.
- Updated dependencies [[`3e9922d`](https://github.com/Nuvraxis/nuvui/commit/3e9922d8100e8fba75ae5cc354d8d79fb00bfdf1)]:
  - @nuvui/react@0.1.1

## 0.1.0

### Minor Changes

- [#10](https://github.com/Nuvraxis/nuvui/pull/10) [`e8cce9f`](https://github.com/Nuvraxis/nuvui/commit/e8cce9f1a08a29d27fceecd3fb4e719b1e5f3f45) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, `@nuvui/date-picker`, with `Calendar`, `DatePicker` and `DateRangePicker`. It's installed next to `@nuvui/react` and has a stylesheet of its own, `@nuvui/date-picker/styles.css`.
  
  - `Calendar` picks one day, several, or a range. It's react-day-picker 10 with this library's styles.
  - `DatePicker` is a field a date can be typed into, with a button that opens the calendar: in a popover, or in a sheet on a phone. With a `name` it submits the date as `yyyy-MM-dd`.
  - `DateRangePicker` has a field for each end of the range and submits each under its own name.
  - Locales come from `@nuvui/date-picker/locale`, and `timeZone` puts the days in a time zone other than the browser's.

### Patch Changes

- Updated dependencies [[`96ea5b0`](https://github.com/Nuvraxis/nuvui/commit/96ea5b066337f2af55990c7c1ab5d2b6167c689d), [`f1888c3`](https://github.com/Nuvraxis/nuvui/commit/f1888c3dd1ae3d577a019a5e90736cddbbbea98e), [`593695e`](https://github.com/Nuvraxis/nuvui/commit/593695e160e11aa9dd63d6f47ce4cdb4093ac63e), [`4fd9569`](https://github.com/Nuvraxis/nuvui/commit/4fd9569dd181fb77194aebdcca84ed76247d0884), [`28459a2`](https://github.com/Nuvraxis/nuvui/commit/28459a2bb5bbab719610be3a7cdd95078bae10c7), [`803ca37`](https://github.com/Nuvraxis/nuvui/commit/803ca371a159e47e0b883445e25a351bcb84ee7b), [`e4fef87`](https://github.com/Nuvraxis/nuvui/commit/e4fef8740a1021d9f55c3ddf049412b44cb4c557), [`c59eabf`](https://github.com/Nuvraxis/nuvui/commit/c59eabfef3028bd4d4a0417ca88dc88d978f706d), [`e47ff84`](https://github.com/Nuvraxis/nuvui/commit/e47ff846062fb1a742ff56d4021a06a8a5eebbc5)]:
  - @nuvui/react@0.1.0
