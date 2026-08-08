import { renderStandardTitleBlock } from "../printLayout/titleBlockSvg";
import type { TitleBlockData } from "../printLayout/types";

/**
 * Back-compat wrapper: builds a standard title block from legacy args.
 * Prefer `printChromeSvg` / `renderStandardTitleBlock` for new call sites.
 */
export function titleBlock(
  svgWidth: number,
  title: string,
  projectName: string,
  viewLabel: string,
  scaleText: string,
  sheetMeta = "",
  sheetCode = "",
  extras?: Partial<TitleBlockData>,
) {
  const data: TitleBlockData = {
    projectName: projectName || "Cabinet Project",
    sheetTitle: title,
    viewLabel,
    sheetCode: sheetCode || "TECHNICAL SHEET",
    scaleText,
    projectNumber: extras?.projectNumber ?? "—",
    customerName: extras?.customerName ?? "—",
    revision: extras?.revision ?? "A",
    statusLabel: extras?.statusLabel ?? "Draft",
    dateText: extras?.dateText ?? new Date().toLocaleDateString(),
    drawnBy: extras?.drawnBy ?? "Designer",
    checkedBy: extras?.checkedBy ?? "—",
    metaLine: sheetMeta || extras?.metaLine || "",
  };
  return renderStandardTitleBlock(svgWidth, data);
}
