import { csvFromHardwareSchedule } from "./hardwareSystem";
import { csvFromProductionCutlist } from "./productionCutlist";
import { csvFromProjectQuote } from "./projectQuote";
import { csvFromSheetYield } from "./sheetYield";
import type { MachineJobDocument } from "./machineExport";
import type { ProjectReport } from "./projectReport";

export type ProductionPackageFile = { name: string; contents: string };

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function csvTable(rows: string[][]) {
  return rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
}

export function productionPackageSlug(report: ProjectReport) {
  const project = report.summary.projectNumber.replace(/[^\w.-]+/g, "-") || "job";
  const client = report.summary.customerName.replace(/[^\w.-]+/g, "-") || "client";
  return `${project}-${client}-rev-${report.summary.revision}`.toLowerCase();
}

function clientManifest(report: ProjectReport) {
  const { summary, job } = report;
  return csvTable([
    ["Field", "Value"],
    ["Client", summary.customerName],
    ["Project number", summary.projectNumber],
    ["Job title", report.jobTitle],
    ["Revision", summary.revision],
    ["Status", job.status],
    ["Cabinets", String(summary.cabinetCount)],
    ["Room", summary.roomSizeLabel],
    ["Cut-list lines", String(report.productionCutlist.length)],
    ["Hardware lines", String(report.hardwareSchedule.length)],
    ["Grand total", String(report.projectCost.grandTotal)],
  ]);
}

function materialsCsv(report: ProjectReport) {
  return csvTable([
    ["Material", "Thickness mm", "Area m2", "Sheets", "Lines"],
    ...report.materialSummary.map((row) => [
      row.material,
      String(row.thicknessMm),
      row.totalAreaM2.toFixed(3),
      String(row.estimatedBoards),
      String(row.lineCount),
    ]),
  ]);
}

function costingCsv(report: ProjectReport) {
  const cost = report.projectCost;
  return csvTable([
    ["Cabinet", "Material", "Waste", "Finish", "Hardware", "Labour", "Total"],
    ...cost.cabinets.map((row) => [
      row.cabinetName,
      String(row.materialCost),
      String(row.wasteCost),
      String(row.finishCost),
      String(row.hardwareCost),
      String(row.labourCost),
      String(row.totalCost),
    ]),
    ["PROJECT", String(cost.totalMaterial), String(cost.totalWaste), String(cost.totalFinish), String(cost.totalHardware), String(cost.totalLabour), String(cost.grandTotal)],
  ]);
}

function machiningCsv(machineJob: MachineJobDocument | null) {
  if (!machineJob) return "Shop Ref,Part,Operation,Kind,Status,Blank\n";
  return csvTable([
    ["Shop Ref", "Part", "Cabinet", "Operation", "Kind", "Status", "Blank"],
    ...machineJob.parts.flatMap((part) =>
      part.operations.map((operation) => [
        part.shopRef,
        part.label,
        part.cabinetName,
        operation.label,
        operation.kind,
        operation.status,
        `${part.blank.lengthMm}x${part.blank.widthMm}x${part.blank.thicknessMm}`,
      ]),
    ),
  ]);
}

export function buildProductionOutputsPackage(
  report: ProjectReport,
  machineJob: MachineJobDocument | null,
): ProductionPackageFile[] {
  const slug = productionPackageSlug(report);
  return [
    { name: `${slug}-00-client.csv`, contents: clientManifest(report) },
    { name: `${slug}-01-materials.csv`, contents: materialsCsv(report) },
    { name: `${slug}-02-nesting.csv`, contents: csvFromSheetYield(report.sheetYield) },
    { name: `${slug}-03-hardware.csv`, contents: csvFromHardwareSchedule(report.hardwareSchedule) },
    { name: `${slug}-04-cutlist.csv`, contents: csvFromProductionCutlist(report.productionCutlist) },
    { name: `${slug}-05-machining.csv`, contents: machiningCsv(machineJob) },
    { name: `${slug}-06-costing.csv`, contents: costingCsv(report) },
    { name: `${slug}-07-quote.csv`, contents: csvFromProjectQuote(report.quote) },
  ];
}

export function serializeProductionOutputsPackage(files: ProductionPackageFile[]) {
  return files
    .map((file) => `===== ${file.name} =====\n${file.contents}`)
    .join("\n\n");
}
