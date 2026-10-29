---
"@nuvui/scheduler": minor
---

EventCalendar takes resources, such as rooms or people, that events are booked against. An event lists its resources in `resourceIds`, and takes its color, `readOnly`, `draggable` and `resizable` from them when it doesn't say, and a resource inside another takes them from the one it's in. The side panel lists the resources, nested, each with a checkbox to show or hide its events and a button to fold those inside it. An event's popover has a resource to choose, or several with `multipleResources`, and `resourceRequired` makes every event need one. An event's name says its resources, and the agenda shows them.

`eventKeys` and `resourceKeys` read events and resources from your own field names, and changes come back under the same names, with your other fields kept. `onEventsChange`, `onEditStart`, `onEventClick`, `onEventDropOutside` and `renderEventFields` are given your own objects.

New props: `resources`, `resourceKeys`, `eventKeys`, `resourceRequired`, `multipleResources`, `hiddenResources`, `defaultHiddenResources`, `onHiddenResourcesChange`, `collapsedResources`, `defaultCollapsedResources` and `onCollapsedResourcesChange`. `eventFields` takes `"resource"`, and has it after the times by default. An item dragged in with `eventDragProps` can carry `resourceIds`. `labels` has the words for all of it.
