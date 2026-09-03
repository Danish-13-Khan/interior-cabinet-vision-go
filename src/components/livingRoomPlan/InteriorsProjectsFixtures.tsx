import { useLayoutEffect, useRef } from "react";
import { isInteriorsQaFixture, type InteriorsQaFixture } from "../../domain/desktopUx";

export const INTERIORS_QA_FIXTURE_EVENT = "interiors-qa-fixture";

/** Test-only event bridge. Golden/Release/Render Studio stay off the customer UI. */
export function useInteriorsProjectsFixtures(handlers: {
  enabled: boolean;
  onOpenDemo: () => void;
  onOpenGoldenRun: () => void;
  onOpenRenderStudio: () => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useLayoutEffect(() => {
    if (!handlers.enabled || !import.meta.env.DEV) return;
    const onFixture = (event: Event) => {
      const method = (event as CustomEvent<InteriorsQaFixture>).detail;
      if (!isInteriorsQaFixture(method)) return;
      if (method === "openReleaseDemo") handlersRef.current.onOpenDemo();
      if (method === "openGoldenRun") handlersRef.current.onOpenGoldenRun();
      if (method === "openRenderStudio") handlersRef.current.onOpenRenderStudio();
    };
    window.addEventListener(INTERIORS_QA_FIXTURE_EVENT, onFixture);
    return () => {
      window.removeEventListener(INTERIORS_QA_FIXTURE_EVENT, onFixture);
    };
  }, [handlers.enabled]);
}
