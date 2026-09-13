/**
 * Minimal SpreadsheetML (.xls XML) so Excel / LibreOffice open BOQ without an xlsx dependency.
 */

import type { BoqViews } from "../boq";
import { boqBoardRoleLabel } from "../boq";
import type { ProjectQuote } from "../projectQuote";
import type { QuoteSnapshot } from "../quoteSettings";

function xmlEscape(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(cells: Array<string | number>): string {
  const parts = cells.map((cell) => {
    const text = xmlEscape(cell);
    const isNum = typeof cell === "number" || /^-?\d+(\.\d+)?$/.test(String(cell));
    if (isNum && String(cell).trim() !== "") {
      return `<Cell><Data ss:Type="Number">${text}</Data></Cell>`;
    }
    return `<Cell><Data ss:Type="String">${text}</Data></Cell>`;
  });
  return `<Row>${parts.join("")}</Row>`;
}

function sheet(name: string, rows: string[]): string {
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${rows.join("")}</Table></Worksheet>`;
}

export function excelXmlFromQuoteAndBoq(args: {
  quote: ProjectQuote;
  boq: BoqViews;
  frozen?: QuoteSnapshot | null;
}): string {
  const quoteRows = [
    row(["Kind", "Label", "Amount", "Detail"]),
    ...args.quote.estimateLines.map((line) =>
      row([line.kind, line.label, line.amount, line.detail ?? ""]),
    ),
    row(["total", "Quote total", args.quote.sellTotal, `Rev ${args.quote.job.revision}`]),
  ];
  const boqRows = [
    row([
      "Mark",
      "Cabinet",
      "Part",
      "Role",
      "Material",
      "Thickness",
      "Qty",
      "Area m2",
      "Sell",
    ]),
    ...args.boq.lines.map((line) =>
      row([
        line.mark,
        line.cabinetName,
        line.partLabel,
        boqBoardRoleLabel(line.role),
        line.material,
        line.thicknessMm,
        line.quantity,
        line.areaM2,
        line.sellPrice,
      ]),
    ),
  ];
  const frozen = args.frozen;
  const snapRows = frozen
    ? [
        row(["Field", "Value"]),
        row(["Id", frozen.id]),
        row(["Revision", frozen.revision]),
        row(["Sell total", frozen.sellTotal]),
        row(["Rates fingerprint", frozen.ratesFingerprint ?? ""]),
        ...frozen.summaryLines.map((line) => row([line.label, line.amount])),
      ]
    : [row(["Field", "Value"]), row(["Frozen", "none"])];

  return [
    '<?xml version="1.0"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    sheet("Quote", quoteRows),
    sheet("BOQ", boqRows),
    sheet("Frozen", snapRows),
    "</Workbook>",
  ].join("");
}
