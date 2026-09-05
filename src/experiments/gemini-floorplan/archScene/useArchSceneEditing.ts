import { useEffect, useMemo, useState } from "react";
import type { GeminiFloorProposal } from "../proposalTypes";
import type { ArchitecturalScene } from "./archSceneTypes";
import {
  inferDoorSwing,
  moveOpeningAlongWall,
  rehostOpening,
  resizeOpening,
  setOpeningSwing,
} from "./bindOpenings";
import { proposalToArchScene } from "./proposalToArchScene";
import { buildWallTopology, joinWallEndpoints, splitWallAt } from "./wallTopology";

function fingerprint(p: GeminiFloorProposal | null): string {
  if (!p) return "empty";
  const walls = p.walls
    .map((w) => `${w.id}:${w.a.x},${w.a.y}-${w.b.x},${w.b.y}`)
    .join("|");
  const ops = (p.openings ?? []).map((o) => `${o.id}:${o.wallId ?? ""}`).join("|");
  return `${walls}#${ops}#${p.rooms.length}`;
}

/** Editable ArchitecturalScene + selection for Phases 7–14 lab UI. */
export function useArchSceneEditing(proposal: GeminiFloorProposal | null) {
  const fp = fingerprint(proposal);
  const [scene, setScene] = useState<ArchitecturalScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);

  useEffect(() => {
    setScene(proposal ? proposalToArchScene(proposal) : null);
    setSelectedId(null);
    setAcceptedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint covers proposal geometry
  }, [fp]);

  const actions = useMemo(
    () => ({
      select: setSelectedId,
      joinEnds: (wallIdA: string, wallIdB: string) => {
        setScene((s) => {
          if (!s) return s;
          const joined = joinWallEndpoints(s.walls, wallIdA, "end", wallIdB, "start");
          const { walls, junctions } = buildWallTopology(joined);
          return { ...s, walls, wallJunctions: junctions };
        });
      },
      splitSelected: () => {
        setScene((s) => {
          if (!s || !selectedId) return s;
          const w = s.walls.find((x) => x.id === selectedId);
          if (!w) return s;
          const mid = {
            x: (w.start.x + w.end.x) / 2,
            y: (w.start.y + w.end.y) / 2,
          };
          const split = splitWallAt(s.walls, w.id, mid);
          const { walls, junctions } = buildWallTopology(split);
          return { ...s, walls, wallJunctions: junctions };
        });
      },
      moveOpening: (id: string, t: number) => {
        setScene((s) => (s ? { ...s, openings: moveOpeningAlongWall(s.openings, id, t) } : s));
      },
      resizeOpening: (id: string, widthMm: number) => {
        setScene((s) => (s ? { ...s, openings: resizeOpening(s.openings, id, widthMm) } : s));
      },
      rehostOpening: (id: string, wallId: string) => {
        setScene((s) => (s ? { ...s, openings: rehostOpening(s.openings, id, wallId) } : s));
      },
      setSwing: (id: string, swing: "left" | "right" | "unknown") => {
        setScene((s) => (s ? { ...s, openings: setOpeningSwing(s.openings, id, swing) } : s));
      },
      inferSwings: () => {
        setScene((s) => {
          if (!s) return s;
          return {
            ...s,
            openings: s.openings.map((o) =>
              o.kind === "door" ? { ...o, swing: inferDoorSwing(o) } : o,
            ),
          };
        });
      },
      setFixtureReview: (id: string, review: "accepted" | "rejected" | "pending") => {
        setScene((s) =>
          s
            ? {
                ...s,
                fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, review } : f)),
              }
            : s,
        );
      },
      setCatalog: (id: string, catalogId: string) => {
        setScene((s) =>
          s
            ? {
                ...s,
                fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, catalogId } : f)),
              }
            : s,
        );
      },
      setLighting: (lightingPreset: "studio" | "warm" | "cool") => {
        setScene((s) => (s ? { ...s, lightingPreset } : s));
      },
      setSkirting: (skirtingMm: number) => {
        setScene((s) => (s ? { ...s, skirtingMm } : s));
      },
      toggleEntityAccept: (id: string) => {
        setAcceptedIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
      },
    }),
    [selectedId],
  );

  return { scene, selectedId, acceptedIds, ...actions };
}
