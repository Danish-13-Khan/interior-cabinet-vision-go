import type { LivingRoomStyleId, PlannerStarterTemplate } from "../../domain/livingRoom";

const STARTERS: Array<{
  template: PlannerStarterTemplate;
  styleId?: LivingRoomStyleId;
  title: string;
  note: string;
}> = [
  { template: "blank-room", title: "Blank room", note: "Empty canvas — draw the floor and walls." },
  { template: "wardrobe-wall", title: "Wardrobe wall", note: "Start a cabinet-led room concept." },
  { template: "l-room", title: "L-room", note: "Freeform L footprint ready for millwork." },
  { template: "2-room-flat", title: "2-room flat", note: "Living and bedroom split by a shared wall." },
  { template: "import-plan", styleId: "nordic-light", title: "Import a plan", note: "Use a PNG, JPG, or WebP tracing underlay." },
];

export function InteriorsProjectsStarters({
  onCreate,
}: {
  onCreate: (template: PlannerStarterTemplate, styleId?: LivingRoomStyleId) => void;
}) {
  return (
    <section className="planner-v2-starts interiors-projects-starts">
      <header>
        <span>Start from</span>
        <small>Optional room shells — the default is a blank cabinet job</small>
      </header>
      <div>
        {STARTERS.map((item) => (
          <button
            type="button"
            key={item.template}
            onClick={() => onCreate(item.template, item.styleId)}
          >
            <strong>{item.title}</strong>
            <small>{item.note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
