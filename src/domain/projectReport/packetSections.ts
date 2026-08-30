export const PROJECT_REPORT_PACKET_SECTIONS: Array<{
  id: string;
  title: string;
  description: string;
}> = [
  {
    id: "cover",
    title: "Job Cover",
    description: "Customer, project number, revision, and status",
  },
  {
    id: "review",
    title: "Review / Revisions",
    description: "Snapshots, change log, approval, and release gates",
  },
  {
    id: "schedule",
    title: "Cabinet Schedule",
    description: "Marks, sizes, runs, and unit costs",
  },
  {
    id: "runs",
    title: "Room / Run Summary",
    description: "Detected runs, fillers, and countertops",
  },
  {
    id: "materials",
    title: "Material Takeoff",
    description: "Board estimates by material and thickness",
  },
  {
    id: "optimize",
    title: "Sheet Yield",
    description: "Sheet definitions, cut grouping, waste, and offcuts",
  },
  {
    id: "hardware",
    title: "Hardware Schedule",
    description: "Hinges, slides, handles, legs, accessories, and costs",
  },
  {
    id: "cutlist",
    title: "Workshop Cutlist",
    description: "Shop refs, part sizes, and grouping",
  },
  {
    id: "costing",
    title: "Costing Summary",
    description: "Material, hardware, labour, and totals",
  },
  {
    id: "quote",
    title: "Quote / Estimate",
    description: "Itemized sell prices, markup, tax, and revision snapshots",
  },
];
