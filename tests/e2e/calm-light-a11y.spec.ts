import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CALM_LIGHT_PAGES, calmLightContextPage } from "./calmLightPages";

for (const entry of CALM_LIGHT_PAGES) {
  test(`axe: no serious or critical WCAG AA issues on ${entry.name}`, async ({ browser }) => {
    test.setTimeout(90_000);
    const { context, page } = await calmLightContextPage(browser, entry);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude("canvas")
      .analyze();
    const blocking = result.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${violation.id} (${violation.nodes.length}): ${violation.nodes
        .slice(0, 3).map((node) => node.target.join(" ")).join(" | ")}`);
    expect(blocking, blocking.join("\n")).toEqual([]);
    await context.close();
  });
}
