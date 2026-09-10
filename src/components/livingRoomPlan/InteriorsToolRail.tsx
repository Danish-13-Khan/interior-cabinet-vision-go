import {
  INTERIORS_CHROME_TOOLS,
  interiorsChromeBuildTool,
  interiorsWorkflowToolsForArea,
  isInteriorsChromeToolReady,
  type InteriorsChromeTool,
  type InteriorsWorkflowArea,
} from "../../domain/desktopUx";
import { InteriorsChromeIcon } from "./InteriorsChromeIcons";

type InteriorsToolRailProps = {
  workflowArea: InteriorsWorkflowArea;
  activeTool: InteriorsChromeTool;
  onTool: (tool: InteriorsChromeTool) => void;
};

export function InteriorsToolRail({ workflowArea, activeTool, onTool }: InteriorsToolRailProps) {
  const areaTools = new Set(interiorsWorkflowToolsForArea(workflowArea));
  const tools = INTERIORS_CHROME_TOOLS.filter((tool) => areaTools.has(tool.id));

  return (
    <nav className="lr-chrome-rail" aria-label="Drawing tools" data-testid="interiors-tool-rail">
      {tools.flatMap((tool, index) => {
        const previous = tools[index - 1];
        const ready = isInteriorsChromeToolReady(tool.id);
        const button = (
          <button
            key={tool.id}
            type="button"
            data-testid={`interiors-tool-${tool.id}`}
            data-build-tool={tool.group === "room" ? interiorsChromeBuildTool(tool.id) : undefined}
            className={activeTool === tool.id ? "is-active" : ""}
            title={ready ? tool.label : `${tool.label} — coming later`}
            disabled={!ready}
            onClick={() => onTool(tool.id)}
          >
            <InteriorsChromeIcon name={tool.id} />
            <span>{tool.label}</span>
          </button>
        );
        if (previous && previous.group !== tool.group) {
          return [<span key={`break-${tool.id}`} className="lr-chrome-rail-break" />, button];
        }
        return [button];
      })}
    </nav>
  );
}
