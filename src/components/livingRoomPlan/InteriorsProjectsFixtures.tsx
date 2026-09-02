import { useLayoutEffect, useRef } from "react";

export const INTERIORS_QA_FIXTURE_EVENT = "interiors-qa-fixture";

type InteriorsQaFixture = "openReleaseDemo" | "openGoldenRun";

/** Test-only event bridge. It exists only while the Projects screen is open. */
export function useInteriorsProjectsFixtures(handlers: {
  enabled: boolean;
  onOpenDemo: () => void;
  onOpenGoldenRun: () => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useLayoutEffect(() => {
    if (!handlers.enabled || !import.meta.env.DEV) return;
    const onFixture = (event: Event) => {
      const method = (event as CustomEvent<InteriorsQaFixture>).detail;
      if (method === "openReleaseDemo") handlersRef.current.onOpenDemo();
      if (method === "openGoldenRun") handlersRef.current.onOpenGoldenRun();
    };
    window.addEventListener(INTERIORS_QA_FIXTURE_EVENT, onFixture);
    return () => {
      window.removeEventListener(INTERIORS_QA_FIXTURE_EVENT, onFixture);
    };
  }, [handlers.enabled]);
}
