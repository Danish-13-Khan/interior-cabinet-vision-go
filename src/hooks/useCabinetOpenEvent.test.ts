import { describe, expect, it } from "vitest";
import { openCabinetPathStream } from "./useCabinetOpenEvent";

describe("cabinet file open", () => {
  it("listens before taking the pending path and does not open that path twice", async () => {
    const order: string[] = [];
    let deliver: (path: string) => void = () => undefined;
    const result = await openCabinetPathStream({
      listen: async (onPath) => {
        order.push("listen");
        deliver = onPath;
        return () => undefined;
      },
      takePending: async () => {
        order.push("take");
        return "/tmp/room.cabinet";
      },
    }, (path) => order.push(path));
    expect(order).toEqual(["listen", "take", "/tmp/room.cabinet"]);
    deliver("/tmp/later.cabinet");
    expect(order).toContain("/tmp/later.cabinet");
    expect(result.openedLaunch).toBe(true);
  });

  it("does not take a path the listener already opened", async () => {
    const opened: string[] = [];
    await openCabinetPathStream({
      listen: async (onPath) => {
        onPath("/tmp/room.cabinet");
        return () => undefined;
      },
      takePending: async () => "/tmp/room.cabinet",
    }, (path) => opened.push(path));
    expect(opened).toEqual(["/tmp/room.cabinet"]);
  });

  it("leaves the pending path for the next run when cancelled after listening", async () => {
    let took = false;
    const opened: string[] = [];
    const result = await openCabinetPathStream({
      listen: async () => () => undefined,
      takePending: async () => {
        took = true;
        return "/tmp/room.cabinet";
      },
    }, (path) => opened.push(path), () => true);
    expect(took).toBe(false);
    expect(opened).toEqual([]);
    expect(result.openedLaunch).toBe(false);
  });
});
