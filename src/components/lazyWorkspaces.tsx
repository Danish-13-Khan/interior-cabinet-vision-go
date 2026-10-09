import { lazy, Suspense, type ComponentProps, type ComponentType } from "react";

type InteriorsProps = ComponentProps<typeof import("./LivingRoomPlanWorkspace").LivingRoomPlanWorkspace>;
type EngineeringProps = ComponentProps<typeof import("./EngineeringReviewWorkspace").EngineeringReviewWorkspace>;
type ReportCenterProps = ComponentProps<typeof import("./ReportCenter").ReportCenter>;
/** Includes `ref` (React 19 passes it as a prop through to the forwardRef component). */
type CabinetWorkspaceProps = ComponentProps<typeof import("./AppWorkspace").AppWorkspace>;

/** Only one workbench renders at a time; each loads as its own chunk on first open. */
function lazyWorkspace<P extends object>(load: () => Promise<ComponentType<P>>) {
  const Lazy = lazy(async () => ({ default: await load() })) as unknown as ComponentType<P>;
  return function LazyWorkspace(props: P) {
    return (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

export const LivingRoomPlanWorkspace = lazyWorkspace<InteriorsProps>(
  () => import("./LivingRoomPlanWorkspace").then((m) => m.LivingRoomPlanWorkspace),
);

export const EngineeringReviewWorkspace = lazyWorkspace<EngineeringProps>(
  () => import("./EngineeringReviewWorkspace").then((m) => m.EngineeringReviewWorkspace),
);

export const AppWorkspace = lazyWorkspace<CabinetWorkspaceProps>(
  () => import("./AppWorkspace").then((m) => m.AppWorkspace),
);

export const ReportCenter = lazyWorkspace<ReportCenterProps>(
  () => import("./ReportCenter").then((m) => m.ReportCenter),
);
