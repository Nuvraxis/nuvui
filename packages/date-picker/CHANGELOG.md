# @nuvui/date-picker

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
