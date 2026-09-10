import type { ProjectJobMeta } from "../../domain/jobMeta";

/** Minimal identity fields so the existing proposal identity gate can pass. */
export function InteriorsProposalIdentity({
  job,
  onJob,
}: {
  job: ProjectJobMeta;
  onJob: (patch: Partial<ProjectJobMeta>) => void;
}) {
  return (
    <section className="proposal-review-fields interiors-proposal-identity" data-testid="interiors-proposal-identity">
      <strong>Client identity</strong>
      <label>
        Customer
        <input
          value={job.customerName}
          data-testid="interiors-proposal-customer"
          onChange={(event) => onJob({ customerName: event.currentTarget.value })}
        />
      </label>
      <label>
        Project #
        <input
          value={job.projectNumber}
          data-testid="interiors-proposal-project-number"
          onChange={(event) => onJob({ projectNumber: event.currentTarget.value })}
        />
      </label>
    </section>
  );
}
