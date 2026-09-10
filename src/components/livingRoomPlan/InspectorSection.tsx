import type { ReactNode } from "react";

type InspectorSectionProps = {
  title: string;
  children: ReactNode;
  testId?: string;
};

/** Advanced blocks expand in normal flow; essentials stay outside these sections. */
export function InspectorSection({ title, children, testId }: InspectorSectionProps) {
  return (
    <details className="lr-inspector-section" data-testid={testId}>
      <summary>{title}</summary>
      <div className="lr-inspector-section-body">{children}</div>
    </details>
  );
}
