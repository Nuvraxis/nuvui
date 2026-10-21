import { forwardRef } from "react";
import {
  type BackgroundOwnProps,
  type BackgroundRootProps,
  backgroundRoot,
  Scrim,
} from "../../core/root";

export interface GradientBackgroundOwnProps extends BackgroundOwnProps {
  /** Stops the colors where they are. */
  paused?: boolean;
}

export interface GradientBackgroundProps
  extends GradientBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * Soft fields of the theme's colors that drift and change places slowly.
 * It's drawn in CSS alone, so it works in a server component and looks the
 * same before any script has run.
 */
export const GradientBackground = forwardRef<
  HTMLDivElement,
  GradientBackgroundProps
>(function GradientBackground(
  { children, scrim = "none", paused = false, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      {...backgroundRoot("nuv-gradient-background", scrim, className)}
      data-paused={paused || undefined}
    >
      <span className="nuv-background__layer" aria-hidden="true">
        <span className="nuv-gradient-background__field" />
        <span className="nuv-gradient-background__field" />
        <span className="nuv-gradient-background__field" />
      </span>
      <Scrim scrim={scrim} />
      {children}
    </div>
  );
});
