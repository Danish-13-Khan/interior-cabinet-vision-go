import {
  contextualRailCommands,
  resolveContextualRailKind,
  type ContextualRailCommandId,
  type ContextualRailKind,
} from "../../domain/livingRoom";

type Props = {
  kind: ContextualRailKind;
  workspaceView?: "plan" | "model" | "render";
  disabledIds?: readonly ContextualRailCommandId[];
  onCommand: (id: ContextualRailCommandId) => void;
};

/** Selection-aware command strip (§4.1) — wires existing chrome actions. */
export function ContextualCommandRail({
  kind, workspaceView, disabledIds = [], onCommand,
}: Props) {
  const commands = contextualRailCommands(kind, { workspaceView });
  const disabled = new Set(disabledIds);
  return (
    <div
      className="lr-contextual-command-rail"
      data-testid="contextual-command-rail"
      data-rail-kind={kind}
      data-rail-view={workspaceView ?? ""}
      role="toolbar"
      aria-label="Contextual commands"
    >
      {commands.map((command) => (
        <button
          key={command.id}
          type="button"
          data-testid={command.testId}
          disabled={disabled.has(command.id)}
          onClick={() => onCommand(command.id)}
        >
          {command.label}
        </button>
      ))}
    </div>
  );
}

export function contextualRailKindFromStage(input: {
  activeWallId: string | null;
  selectedObjects: readonly { category?: string; kind?: string; catalogItemId?: string }[];
}): ContextualRailKind {
  return resolveContextualRailKind(input);
}
