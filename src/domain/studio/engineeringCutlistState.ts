export function engineeringCutlistState(input: {
  lineCount: number;
  status: string;
  machineError: string | null;
}): { kind: "ready" } | { kind: "empty"; message: string } | { kind: "blocked"; message: string } {
  if (input.lineCount > 0) return { kind: "ready" };
  const blocked = [input.machineError, input.status].filter(Boolean).join(" ").trim();
  if (input.machineError || /block|error|fail|diagnostic|identity/i.test(blocked)) {
    return {
      kind: "blocked",
      message: blocked || "Manufacturing export is blocked.",
    };
  }
  return { kind: "empty", message: "No manufactured parts in this project yet." };
}
