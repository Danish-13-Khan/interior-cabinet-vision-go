import {
  INTERIORS_CHROME_TOOLS,
  interiorsChromeBuildTool,
  isInteriorsChromeToolReady,
  type InteriorsChromeTool,
} from "../../domain/desktopUx";
import { InteriorsChromeIcon } from "./InteriorsChromeIcons";

type InteriorsToolRailProps = {
  activeTool: InteriorsChromeTool;
  onTool: (tool: InteriorsChromeTool) => void;
};

export function InteriorsToolRail({ activeTool, onTool }: InteriorsToolRailProps) {
  return (
    <nav className="lr-chrome-rail" aria-label="Drawing tools" data-testid="interiors-tool-rail">
      {INTERIORS_CHROME_TOOLS.flatMap((tool, index) => {
        const previous = INTERIORS_CHROME_TOOLS[index - 1];
        const ready = isInteriorsChromeToolReady(tool.id);
        const button = (
          <button
            key={tool.id}
            type="button"
            data-testid={`interiors-tool-${tool.id}`}
            data-build-tool={tool.group === "room" ? interiorsChromeBuildTool(tool.id) : undefined}
            className={activeTool === tool.id ? "is-active" : ""}
            title={ready ? tool.label : `${tool.label} — coming in Cabinet Run`}
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
