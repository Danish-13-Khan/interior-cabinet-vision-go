import type { LabStatusModel } from "./labStatus";

type Props = { status: LabStatusModel };

export function LabStatusBar({ status }: Props) {
  return (
    <div className={`gfl-status gfl-status--${status.phase}`} role="status">
      <strong>{status.headline}</strong>
      <span>{status.detail}</span>
    </div>
  );
}
