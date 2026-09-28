import type { ReviewIssueGroup } from "../../domain/livingRoom/reviewIssueGroups";

type Props = {
  groups: readonly ReviewIssueGroup[];
  onSelect: (objectIds: string[]) => void;
};

const MARK = { blocking: "!", warning: "△", info: "i" } as const;

/** Grouped plan + model issues; each row selects and frames every object it covers. */
export function ReviewIssueList({ groups, onSelect }: Props) {
  if (groups.length === 0) {
    return <p className="review-issue-clear" data-testid="review-issues-clear">No plan or model issues.</p>;
  }
  return (
    <ul className="review-issue-list" data-testid="review-issue-list">
      {groups.map((group) => (
        <li key={group.id}>
          <button
            type="button"
            className={`review-issue-row is-${group.severity}`}
            data-review-issue={group.code}
            data-review-severity={group.severity}
            disabled={group.objectIds.length === 0}
            onClick={() => onSelect(group.objectIds)}
          >
            <b aria-hidden>{MARK[group.severity]}</b>
            <span>
              <strong>{group.title}</strong>
              <small>
                {group.severity === "blocking" ? "Blocks proposal · " : ""}
                {group.detail}
                {group.objectIds.length > 1 ? ` · Select ${group.objectIds.length}` : ""}
              </small>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
