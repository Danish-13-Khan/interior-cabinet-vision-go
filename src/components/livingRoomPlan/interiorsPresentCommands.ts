import type { InteriorsPresentStep } from "../../domain/desktopUx";

export type InteriorsPresentCommands = {
  step: InteriorsPresentStep;
  needsCapture: boolean;
  sellTotalLabel: string;
  revision: string;
  frozen: boolean;
  blockingCount: number;
};
