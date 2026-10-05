export default function Example() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-4 text-surface-foreground">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">Team plan</p>
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          Current
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ten seats, billed once a year.
      </p>
    </div>
  );
}
