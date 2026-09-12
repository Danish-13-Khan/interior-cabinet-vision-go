import type { ReactNode } from "react";

export function LivingRoomPlanHomeShell(args: {
  uiMode: string;
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`lr-plan-shell lr-product-shell lr-product-shell-v2 is-project-home is-ui-${args.uiMode}`} data-ui-mode={args.uiMode}>
      {args.header}
      <div className="lr-empty-workspace">{args.children}</div>
    </section>
  );
}
