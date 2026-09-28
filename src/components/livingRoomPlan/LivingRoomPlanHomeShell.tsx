import type { ReactNode } from "react";

export function LivingRoomPlanHomeShell(args: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="lr-plan-shell lr-product-shell lr-product-shell-v2 is-project-home">
      {args.header}
      <div className="lr-empty-workspace">{args.children}</div>
    </section>
  );
}
