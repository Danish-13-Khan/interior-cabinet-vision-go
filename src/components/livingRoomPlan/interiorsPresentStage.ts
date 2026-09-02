import { formatQuoteMoney } from "../../domain/quoteSettings";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import { interiorsPresentPanelState } from "./InteriorsPresentPanel";
import type { InteriorsPresentCommands } from "./interiorsPresentCommands";

export function interiorsPresentStageCommands(
  props: LivingRoomPlanWorkspaceBodyProps,
): InteriorsPresentCommands {
  const state = interiorsPresentPanelState(props.proposal, props.handoff);
  const live = props.proposal.live;
  const quote = live?.quote;
  return {
    step: state.step,
    needsCapture: state.needsCapture,
    sellTotalLabel: quote
      ? formatQuoteMoney(quote.sellTotal, quote.settings.currencyLabel)
      : "—",
    revision: quote?.job.revision ?? "A",
    frozen: Boolean(live?.frozen) && !live?.stale,
    blockingCount: state.blocking.length,
  };
}
