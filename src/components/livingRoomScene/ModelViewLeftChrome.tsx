import type { ReactNode } from "react";

/** Stacks 3D camera toolbar + Hide Wall so wrap height never covers wall actions. */
export function ModelViewLeftChrome(props: { toolbar: ReactNode; wallAction?: ReactNode }) {
  return (
    <div className="lr-model-left-chrome" data-testid="model-left-chrome">
      {props.toolbar}
      {props.wallAction}
    </div>
  );
}
