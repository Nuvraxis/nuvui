import { Checkbox } from "@nuvui/react/checkbox";
import { Label } from "@nuvui/react/label";
import { type CSSProperties, useId } from "react";
import {
  type CalendarResource,
  shownState,
  toggleResource,
} from "../../core/resources";
import { useCalendar } from "./context";
import { colorOf } from "./event-button";

interface ResourceListProps {
  resources: readonly CalendarResource[];
  hidden: readonly string[];
  onHiddenChange: (hidden: string[]) => void;
  collapsed: readonly string[];
  onCollapsedChange: (collapsed: string[]) => void;
}

/**
 * The resources in the side panel: a checkbox to show or hide the events
 * of each, and of those inside it, and a button on each that has others
 * inside it to fold them away.
 */
export function ResourceList(props: ResourceListProps) {
  const { labels, headingLevel } = useCalendar();
  const id = useId();
  const Heading = `h${headingLevel + 1}` as "h3";
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="nuv-event-calendar__resources"
    >
      <Heading
        id={`${id}-heading`}
        className="nuv-event-calendar__resources-title"
      >
        {labels.resources}
      </Heading>
      <Rows {...props} list={props.resources} />
    </section>
  );
}

function Rows({
  list,
  id,
  folded,
  ...props
}: ResourceListProps & {
  list: readonly CalendarResource[];
  id?: string;
  folded?: boolean;
}) {
  return (
    <ul id={id} hidden={folded} className="nuv-event-calendar__resource-list">
      {list.map((resource) => (
        <Row key={resource.id} resource={resource} {...props} />
      ))}
    </ul>
  );
}

function Row({
  resource,
  ...props
}: ResourceListProps & { resource: CalendarResource }) {
  const { labels, color, resources } = useCalendar();
  const id = useId();
  const { hidden, onHiddenChange, collapsed, onCollapsedChange } = props;
  const children = resource.children ?? [];
  const open = !collapsed.includes(resource.id);
  const swatch = resources.get(resource.id)?.settings.color ?? color ?? "1";

  return (
    <li>
      <div className="nuv-event-calendar__resource-row">
        {children.length > 0 ? (
          <button
            type="button"
            className="nuv-event-calendar__fold"
            aria-label={labels.resourcesIn(resource.title)}
            aria-expanded={open}
            aria-controls={`${id}-group`}
            onClick={() =>
              onCollapsedChange(
                open
                  ? [...collapsed, resource.id]
                  : collapsed.filter((item) => item !== resource.id),
              )
            }
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        ) : (
          <span className="nuv-event-calendar__fold-space" />
        )}
        <Checkbox
          id={`${id}-shown`}
          checked={shownState(resource.id, resources, new Set(hidden))}
          onCheckedChange={() =>
            onHiddenChange(toggleResource(resource.id, resources, hidden))
          }
        />
        <span
          aria-hidden="true"
          className="nuv-event-calendar__swatch"
          style={{ "--nuv-event-color": colorOf(swatch) } as CSSProperties}
        />
        <Label
          htmlFor={`${id}-shown`}
          className="nuv-event-calendar__resource-name"
        >
          {resource.title}
        </Label>
      </div>
      {children.length > 0 ? (
        <Rows {...props} list={children} id={`${id}-group`} folded={!open} />
      ) : null}
    </li>
  );
}
