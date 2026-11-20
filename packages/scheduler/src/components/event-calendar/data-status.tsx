import { Button } from "@nuvui/react/button";
import { Spinner } from "@nuvui/react/spinner";
import type { SchedulerLabels } from "../../core/labels";
import type { useEventSource } from "./data-source";

interface DataStatusProps {
  source: ReturnType<typeof useEventSource>;
  labels: SchedulerLabels;
}

/**
 * Whether the days shown are loading, or couldn't be loaded, or a change
 * couldn't be saved, in the header. The text is a live region from the
 * start, so each change to it is said.
 */
export function DataStatus({ source, labels }: DataStatusProps) {
  if (!source.active) return null;
  const { loading, failed, saveFailed } = source;
  const state = loading
    ? "loading"
    : failed
      ? "failed"
      : saveFailed
        ? "unsaved"
        : "idle";
  return (
    <div className="nuv-event-calendar__status" data-state={state}>
      <span role="status" className="nuv-event-calendar__status-text">
        {loading ? (
          <>
            <Spinner size="sm" label="" />
            {labels.loading}
          </>
        ) : failed ? (
          labels.loadFailed
        ) : saveFailed ? (
          labels.saveFailed
        ) : null}
      </span>
      {state === "failed" ? (
        <Button intent="secondary" size="sm" onClick={source.retry}>
          {labels.tryAgain}
        </Button>
      ) : state === "unsaved" ? (
        <Button intent="ghost" size="sm" onClick={source.dismiss}>
          {labels.close}
        </Button>
      ) : null}
    </div>
  );
}
