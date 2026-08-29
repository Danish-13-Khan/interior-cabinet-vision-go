# Cabinet Studio Backend, SaaS and Commercial Platform Book

**Document role:** Canonical backend, account, subscription, cloud-data, and operations specification  
**Product relationship:** Companion to the [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md)  
**Baseline date:** 2026-08-30  
**Book version:** 0.1.0  
**Owner:** Product and platform engineering  
**Status:** Approved target architecture; no production backend is claimed  

---

## 0. How to use this book

### 0.1 Purpose

This book defines the commercial platform required to sell, license, operate,
sync, and support Cabinet Studio without weakening its local-first cabinet
workflow.

It covers:

- registration, authentication, sessions, and account recovery;
- organizations, invitations, roles, and permissions;
- plans, trials, subscriptions, invoices, and entitlements;
- desktop licensing, device activation, and offline grace;
- versioned APIs and service contracts;
- cloud projects, revisions, conflict handling, and recovery;
- uploaded 3D assets, textures, processing, and organization catalogs;
- email, notifications, administration, support, audit, and observability;
- security, privacy, backup, deployment, migration, and release gates.

It does not redefine cabinet geometry, quotation rules, engineering output, or
the Golden Cabinet Run. Those belong to the Product Book.

### 0.2 Current baseline

As of the baseline date, Cabinet Studio is a local-first Tauri application.
Repository inspection found no production account service, hosted API,
subscription integration, organization database, or cloud-sync service.

Therefore:

- every hosted capability in this book begins as `NEXT`, `LATER`, or `RESEARCH`;
- this book must not be cited as evidence that a backend feature has shipped;
- local project ownership and local save/reopen remain valid while the platform
  is introduced;
- no release may make a user's local project unreadable merely because a remote
  service or subscription is unavailable.

### 0.3 Document precedence

For backend and commercial-platform behavior, use this order:

1. A newer explicit decision recorded in this book.
2. Security or data-safety ADRs.
3. Deployed contracts, database migrations, and verified behavior.
4. The Cabinet Studio Product Book.
5. Provider dashboards, implementation notes, and historical roadmaps.

The Product Book still governs buyer workflow and cabinet-domain behavior.

### 0.4 Status vocabulary

| Status | Meaning |
| --- | --- |
| `CURRENT` | Verified behavior in the repository or deployed environment. |
| `NEXT` | Approved for the first commercial-platform milestone. |
| `LATER` | Valuable after the active milestone. |
| `RESEARCH` | Needs a provider, customer, legal, or technical decision. |
| `EXCLUDED` | Deliberately outside current strategy. |

### 0.5 Requirement language

- **Must** is mandatory only when its mapped milestone is active.
- **Should** is expected unless a documented tradeoff is approved.
- **May** is optional.
- **Must not** is prohibited.
- The release gates in Section 22 determine what blocks a release.

### 0.6 Requirement prefixes

| Prefix | Area |
| --- | --- |
| `PLT` | platform-wide contract |
| `AUT` | authentication and sessions |
| `ORG` | organizations and roles |
| `BIL` | subscription and billing |
| `LIC` | licensing and entitlements |
| `API` | API standards |
| `CLD` | project cloud and sync |
| `ASTC` | cloud asset service |
| `NOT` | notifications |
| `ADM` | administration and support |
| `SEC` | security and privacy |
| `OPS` | operations and reliability |

IDs are stable after implementation starts.

---

## 1. Platform promise and boundaries

### 1.1 Promise

> A cabinet business can securely license Cabinet Studio, manage its team,
> preserve its projects and asset catalog, and understand its commercial status
> without the cloud becoming a new source of cabinet truth.

### 1.2 Local-first rules

1. Cabinet geometry and project content remain usable locally during a temporary
   service outage.
2. Cloud storage adds portability, recovery, and controlled sharing; it does not
   replace the versioned project document.
3. Network operations are explicit, observable, retryable, and idempotent.
4. No silent last-write-wins conflict may discard authored work.
5. Loss of entitlement may disable paid actions after grace, but must not delete
   or encrypt a user's existing local files.
6. A cloud identifier must never replace the stable IDs inside a project.

### 1.3 Commercial boundaries

The platform may manage plans, entitlements, seats, trials, invoices, and usage
limits. It must not store raw payment-card data. Checkout and payment instruments
belong to a compliant billing provider.

### 1.4 Explicit non-goals

- a public furniture marketplace;
- ERP, payroll, or general accounting;
- vendor inventory procurement in the first platform release;
- cloud CNC execution or a claim of machine-ready manufacturing;
- social-network features;
- AI decoration or AI credits as the initial commercial wedge;
- real-time multiplayer editing before reliable revision sync exists.

---

## 2. Users, organizations, and roles

### 2.1 Core records

| Record | Purpose |
| --- | --- |
| User | Human identity and personal security settings. |
| Organization | Cabinet business, billing boundary, and shared-data owner. |
| Membership | User-to-organization relationship with a role and state. |
| Invitation | Time-limited offer to join an organization. |
| Device | Activated Cabinet Studio installation. |
| Subscription | Provider-linked commercial agreement. |
| Entitlement snapshot | Signed effective capabilities for a user, organization, and device. |

### 2.2 Initial roles

| Role | Intended access |
| --- | --- |
| Owner | Full organization, billing, membership, data, and deletion control. |
| Admin | Membership, settings, projects, and assets; no ownership transfer by default. |
| Billing admin | Subscription and invoices; no project-content access by default. |
| Sales designer | Create and edit room, proposal, and cabinet-project data. |
| Engineer | Review engineering handoff and production outputs. |
| Production | Read approved production packets and relevant project revisions. |
| Viewer | Read explicitly shared projects; no edits. |

Permission checks must be capability based. UI visibility is not authorization.

### 2.3 Membership lifecycle

`invited → active → suspended → removed`

- Invitations must be scoped to one organization and role.
- Tokens must be single-use, hashed at rest, and expire.
- Removal must revoke organization access and refresh sessions.
- Removing a member must not delete organization-owned projects.
- Ownership transfer requires recent authentication and an audit event.

### 2.4 Requirements

- `ORG-001` — Every shared project and cloud asset must have one owning organization.
- `ORG-002` — Every organization request must enforce membership server-side.
- `ORG-003` — Role changes and member removal must revoke stale authorization promptly.
- `ORG-004` — The last owner must not leave without transferring or closing ownership.
- `ORG-005` — Billing access must be separable from design-data access.

---

## 3. Authentication and account lifecycle

### 3.1 First supported flow

1. Register with email and password.
2. Accept terms and privacy notice versions.
3. Verify email.
4. Create or join an organization.
5. Start an eligible trial or accept an assigned seat.
6. Sign in on the desktop application.
7. Activate the device and receive an entitlement snapshot.

### 3.2 Required account operations

- sign in and sign out;
- verify and change email;
- forgot/reset password;
- change password with recent authentication;
- inspect and revoke sessions;
- inspect and deactivate devices;
- export personal data;
- request account deletion subject to organization ownership and retention rules.

### 3.3 Session model

- Use short-lived access tokens and rotating refresh sessions.
- Store desktop secrets only in the operating system's secure credential store.
- Refresh-token reuse must revoke the affected token family.
- Access tokens must include an audience and expiry, not mutable plan logic.
- Organization and entitlement changes must take effect without waiting for a
  long-lived access token to expire.
- High-risk actions require recent authentication.

### 3.4 Password and MFA policy

- Passwords must be processed using a current adaptive password hash.
- Compromised-password screening should be supported without logging passwords.
- Rate-limit login and recovery by account and risk signals.
- MFA is `LATER` but required before enterprise/security-sensitive positioning.
- Social and enterprise SSO are `RESEARCH`, not P0 dependencies.

### 3.5 Requirements

- `AUT-001` — Email verification is required before cloud sharing or billing changes.
- `AUT-002` — Password-reset tokens must be single-use, short-lived, and hashed at rest.
- `AUT-003` — Session revocation must invalidate server access and future refresh.
- `AUT-004` — Authentication errors must not reveal whether an account exists.
- `AUT-005` — Desktop credentials must not be stored in project JSON or plain-text preferences.
- `AUT-006` — Security events must be auditable without recording credentials or tokens.

---

## 4. Plans, subscriptions, and billing

### 4.1 Product model

Do not hard-code pricing into the desktop client or scatter plan-name checks
through features. The server resolves commercial state into entitlements.

Initial commercial concepts:

| Concept | Meaning |
| --- | --- |
| Trial | Time-limited evaluation with explicit expiry. |
| Studio | One business/user-oriented paid offering. |
| Team | Multi-seat organization with shared cloud capabilities. |
| Enterprise | Contracted controls added only when demanded and supportable. |

Names and prices remain commercial decisions. Capabilities use stable keys such
as `cloud_projects`, `organization_assets`, `proposal_branding`, and
`engineering_handoff`.

### 4.2 Billing-provider responsibilities

The chosen provider should own:

- checkout and payment-method collection;
- tax-capable invoice generation where configured;
- payment retries and hosted customer portal;
- invoice and credit-note records;
- signed webhook delivery.

Cabinet Studio owns the customer/organization mapping, effective entitlements,
audit trail, and product behavior.

### 4.3 Subscription lifecycle

`trialing → active → past_due → grace → suspended → canceled`

Exact provider states are normalized into this product state. Webhooks are not
trusted by event order alone.

- A webhook handler must verify signatures.
- Provider event IDs must be deduplicated.
- Effective state must be recomputable from stored provider references.
- Cancellation-at-period-end must display the effective date.
- Failed payment enters a documented grace policy before paid actions stop.
- Refunds and charge disputes require support-visible records.

### 4.4 Seats

- An active paid member consumes a seat when the plan requires it.
- Invitations may reserve a seat only if the commercial rule states so.
- Seat assignment and removal are auditable.
- A plan downgrade must preview affected members and capabilities.
- A downgrade must not silently delete projects or assets above a new quota.

### 4.5 Requirements

- `BIL-001` — Raw card data must never pass through Cabinet Studio services or logs.
- `BIL-002` — Checkout completion must not alone grant access; verified billing state does.
- `BIL-003` — Billing webhooks must be signature-verified, idempotent, and replay-safe.
- `BIL-004` — Price and plan presentation must use server-provided catalog data.
- `BIL-005` — Subscription changes must generate an audit event.
- `BIL-006` — Destructive quota enforcement is prohibited.

---

## 5. Entitlements, licensing, and offline use

### 5.1 Entitlement contract

An entitlement snapshot contains:

- user and organization identifiers;
- plan and subscription status;
- stable capability keys and numeric limits;
- issued-at, refresh-after, and expires-at timestamps;
- device binding when applicable;
- schema/key version;
- server signature.

The desktop verifies the signature and caches the most recent valid snapshot.

### 5.2 Offline behavior

- Local authoring remains available during a reasonable signed grace period.
- Cloud-only actions clearly report that a connection is required.
- A clock anomaly must not immediately destroy access or data.
- After grace expires, the app enters a documented limited mode.
- Limited mode must permit opening, inspecting, and exporting user-owned project
  data in at least one durable format.
- Reconnecting refreshes state before prompting unnecessary repurchase.

### 5.3 Device activation

- Devices receive opaque IDs and user-visible names.
- Users can review and deactivate devices.
- Device limits produce a recoverable resolution flow.
- Reinstallation or hardware change must not permanently consume a seat.
- Device fingerprints must be minimal, documented, and privacy reviewed.

### 5.4 Requirements

- `LIC-001` — Entitlements must be server-issued and cryptographically verifiable offline.
- `LIC-002` — The client must check capabilities, not plan-name strings.
- `LIC-003` — Expired commercial access must not corrupt or delete local projects.
- `LIC-004` — Revocation and grace behavior must be testable with controlled time.
- `LIC-005` — Support must be able to explain the effective entitlement decision.

---

## 6. Platform architecture

### 6.1 Logical components

```text
Tauri desktop / future web clients
              |
       versioned HTTPS API
              |
  identity + organization boundary
              |
  entitlements | projects | assets | notifications | administration
              |
 relational database | object storage | job queue | audit/telemetry
              |
 billing provider | email provider | monitoring provider
```

This is a logical separation, not a requirement to deploy microservices. Start
as a modular service unless scale or isolation justifies decomposition.

### 6.2 Data ownership

| Data | System of record |
| --- | --- |
| Password/session state | Identity store. |
| Organization membership | Platform relational database. |
| Provider invoices/payments | Billing provider, referenced locally. |
| Effective entitlements | Platform entitlement service. |
| Local working project | Versioned local project file. |
| Cloud project revision | Immutable object plus relational metadata. |
| Uploaded GLB/textures | Object storage plus asset metadata. |
| Security/audit actions | Append-oriented audit store. |

### 6.3 Technology selection rules

Specific vendors and frameworks remain open decisions. Choose them using:

- tenant-isolation support;
- reliable migrations and backup/restore;
- regional availability and data-processing terms;
- webhook and object-storage maturity;
- team operational competence;
- total cost at pilot and growth volumes;
- an exit path for core customer data.

---

## 7. API contract

### 7.1 Standards

- HTTPS only outside local development.
- JSON for ordinary request/response bodies.
- `/v1` version prefix for public desktop contracts.
- UTC ISO-8601 timestamps.
- UUID/opaque public IDs; never expose sequential database IDs.
- `request_id` returned on every response and error.
- Cursor pagination for mutable collections.
- Optimistic concurrency through revision/version preconditions.
- Idempotency keys for retryable create and commercial operations.
- Presigned/direct object transfers for large files.

### 7.2 Error envelope

```json
{
  "error": {
    "code": "project_revision_conflict",
    "message": "The cloud project has a newer revision.",
    "request_id": "req_...",
    "details": {}
  }
}
```

Messages may be user-facing. Codes are stable and machine-readable. Internal
stack traces, SQL, secrets, tokens, and provider payloads must not be returned.

### 7.3 Initial endpoint inventory

| Area | Representative endpoints |
| --- | --- |
| Auth | `POST /v1/auth/register`, `/login`, `/refresh`, `/logout`, `/verify-email`, `/password-reset` |
| User | `GET /v1/me`, `PATCH /v1/me`, `GET/DELETE /v1/me/sessions/:id` |
| Devices | `GET /v1/devices`, `POST /v1/devices/activate`, `DELETE /v1/devices/:id` |
| Organizations | `GET/POST /v1/organizations`, `GET/PATCH /v1/organizations/:id` |
| Members | `GET /v1/organizations/:id/members`, invitations, role changes, removal |
| Billing | checkout session, portal session, subscription summary, invoices |
| Entitlements | `GET /v1/organizations/:id/entitlements` and signed desktop snapshot |
| Projects | project metadata, revisions, upload/download intents, archive/restore |
| Assets | asset metadata, uploads, processing status, catalog, archive/restore |
| Notifications | preferences and in-product notification state |
| Audit | organization audit-event query for authorized roles |
| Support/admin | restricted account, job, webhook, and entitlement diagnostics |

Endpoint names are a contract proposal, not shipped routes.

### 7.4 Requirements

- `API-001` — Every organization-scoped route must derive and verify tenant scope server-side.
- `API-002` — Retryable mutations must define idempotency behavior.
- `API-003` — Breaking contracts require a version or compatible migration window.
- `API-004` — Upload/download authorization must be short-lived and object-scoped.
- `API-005` — Rate-limit responses must be explicit and safely retryable.
- `API-006` — Generated API documentation and contract tests must ship with an active API.

---

## 8. Cloud projects and synchronization

### 8.1 Model

A cloud project has mutable metadata and immutable content revisions.

Minimum metadata:

- project ID and owning organization;
- display name and lifecycle state;
- current revision ID;
- project schema version;
- content hash and byte size;
- created/updated actor and timestamps;
- optional client/job reference;
- retention and deletion timestamps.

### 8.2 Upload flow

1. Client authenticates and requests an upload intent.
2. Server checks membership, entitlement, quota, schema support, and size.
3. Client uploads the serialized project to object storage.
4. Server verifies size/hash and creates an immutable revision.
5. Current revision advances only if the client's expected parent still matches.
6. Client records the cloud revision and clears its synchronized outbox item.

### 8.3 Conflict behavior

If the expected parent is stale:

- preserve both revisions;
- stop automatic upload of the conflicting project;
- show local and cloud timestamps/actors;
- allow the user to keep local as a new copy, use cloud, or perform an approved
  domain-aware merge when one exists;
- never silently overwrite either revision.

P0 does not require field-level collaborative merge.

### 8.4 Offline outbox

- Queue sync intentions locally with stable operation IDs.
- Retry with bounded exponential backoff and jitter.
- Persist queue state across restart.
- Do not queue credentials or unbounded duplicate project blobs.
- Provide visible states: local only, syncing, synced, conflict, and error.

### 8.5 Retention and recovery

- Archive is reversible for a documented period.
- Permanent deletion is asynchronous, audited, and applies to objects/backups
  according to the published retention policy.
- Recent project revisions should be restorable.
- Backups are not a substitute for revision history.

### 8.6 Requirements

- `CLD-001` — Cloud sync must preserve the exact versioned project document.
- `CLD-002` — Revision creation must be atomic with current-revision advancement.
- `CLD-003` — Project uploads must use content hashes and expected-parent concurrency.
- `CLD-004` — Conflicts must preserve both authored versions.
- `CLD-005` — Local save must not wait on the network.
- `CLD-006` — Restore and organization export must be tested before sync is called reliable.

---

## 9. Cloud 3D asset and texture service

This service implements the cloud half of Product Book Section 36A. It does not
change the import rules or convert a visual mesh into a production cabinet.

### 9.1 Asset pipeline

`intent → upload → quarantine → scan → inspect → normalize/optimize → thumbnail → ready`

Failed stages retain useful diagnostics without publishing the asset.

### 9.2 Stored objects

- original uploaded GLB and sidecar textures;
- normalized delivery GLB when processing is approved;
- generated thumbnail/preview;
- manifest with dimensions, bounds, axes, mesh/material slots, hashes, and
  processing versions;
- asset metadata, ownership, visibility, lifecycle, and audit history.

### 9.3 Security and portability

- Uploads are private by default and organization-scoped.
- Filenames are display metadata, not storage keys or trusted paths.
- Content type, signature bytes, size, and hashes must be verified.
- Malware scanning and parser isolation are required before production uploads.
- Download URLs are short-lived and authorized.
- Deduplication must not expose whether another organization owns the same hash.
- Deleting an asset must account for project references and retention.

### 9.4 Processing rules

- Optimization must preserve physical dimensions and material-slot meaning.
- Original uploads remain recoverable while retention policy permits.
- Processor version and warnings are recorded.
- Unsupported or lossy conversion requires explicit user acceptance.
- Generated derivatives are replaceable cache; the manifest and original are not.

### 9.5 Requirements

- `ASTC-001` — Asset ownership and every asset read/write must enforce organization scope.
- `ASTC-002` — Upload completion must verify expected byte size and cryptographic hash.
- `ASTC-003` — Untrusted 3D parsing must run with resource and isolation limits.
- `ASTC-004` — An asset becomes selectable only after required validation succeeds.
- `ASTC-005` — Optimization must not silently change dimensions, axes, origin, or slot semantics.
- `ASTC-006` — Project references use stable asset/version IDs, never expiring URLs.
- `ASTC-007` — Visual assets gain production meaning only through an explicit cabinet-family configuration link.

---

## 10. Notifications and email

Initial transactional events:

- verify email and password reset;
- organization invitation;
- subscription/trial state that requires action;
- security-sensitive session/device change;
- cloud processing failure when the user is no longer in the app;
- organization ownership or deletion events.

Rules:

- Security and legally required notices cannot be disabled like marketing.
- Marketing consent is separate and off unless validly obtained.
- Links are time-limited and route through approved application domains.
- Templates are versioned and tested.
- Provider delivery IDs and failures are retained without logging secret tokens.

- `NOT-001` — Transactional email retries must be idempotent.
- `NOT-002` — Notification preferences must be enforced server-side.
- `NOT-003` — No client or project content is placed in email unless necessary and approved.

---

## 11. Administration and support

### 11.1 Support capabilities

Authorized support staff may need to inspect:

- account verification and session history;
- organization membership and invitation state;
- subscription mapping and webhook processing;
- effective entitlement explanation;
- device activations;
- project/asset metadata and processing jobs;
- request IDs, errors, and audit events.

Project content access is not implied. Any exceptional access must be explicit,
time-limited, justified, audited, and consistent with policy.

### 11.2 Safe support actions

- resend verification or invitation;
- revoke sessions/devices;
- replay an idempotent failed job or webhook;
- recompute entitlements from authoritative state;
- apply documented commercial credits through the billing system;
- restore an archived item inside retention.

Support must not directly edit production billing/database state through ad hoc
SQL as a routine workflow.

### 11.3 Requirements

- `ADM-001` — Administrative access requires a dedicated role and MFA before production use.
- `ADM-002` — Every support mutation records actor, reason, target, before/after summary, and request ID.
- `ADM-003` — Impersonation is excluded from P0; any future design requires visible consent and audit.
- `ADM-004` — Support tools must explain state without exposing credentials or payment instruments.

---

## 12. Security and privacy

### 12.1 Baseline controls

- encryption in transit and provider-supported encryption at rest;
- environment-specific secrets in a managed secret store;
- least-privilege service and staff access;
- dependency, secret, and static security scanning in CI;
- tenant-boundary tests on every organization resource type;
- input validation, output encoding, CSRF protection where cookie sessions exist,
  and strict CORS policy;
- rate limits and abuse detection on auth, invitations, uploads, and billing;
- immutable or tamper-evident security audit retention;
- documented incident response and responsible disclosure path.

### 12.2 Data classification

| Class | Examples | Rule |
| --- | --- | --- |
| Restricted | password hashes, refresh tokens, provider secrets | Never logged; tightly isolated. |
| Confidential | project files, client details, quotes, uploaded assets | Tenant-scoped and encrypted. |
| Internal | operational metrics and non-sensitive metadata | Staff need-to-know. |
| Public | published docs and explicitly public assets | Deliberately approved only. |

### 12.3 Privacy lifecycle

- Collect only data needed for product, security, support, and commercial duties.
- Record purpose and retention for each material data class.
- Provide user and organization export in durable formats.
- Support deletion while preserving legally required billing/security records.
- Keep product analytics pseudonymous where practical.
- Do not use private project or asset content for model training without a
  separate explicit agreement.

### 12.4 Requirements

- `SEC-001` — Tenant isolation must be enforced in application logic and tested at the data boundary.
- `SEC-002` — Secrets, tokens, reset links, and full billing payloads must not appear in logs.
- `SEC-003` — Production access must be attributable, least-privilege, and reviewed.
- `SEC-004` — Data export and deletion behavior must be documented and tested.
- `SEC-005` — Security review is required before public account, upload, or payment launch.

---

## 13. Audit and product analytics

### 13.1 Audit events

Audit events include:

- membership, role, and ownership changes;
- login risk, password, session, and device changes;
- subscription and entitlement changes;
- project archive/delete/restore and material sharing actions;
- asset publication/archive/delete;
- administrative actions.

Each event records stable type, timestamp, actor, organization, target, result,
request ID, and safe structured metadata.

### 13.2 Analytics boundary

Product analytics should answer workflow questions, not copy customer designs.
Examples include registration completion, sync success, asset-processing success,
Golden Run completion, and proposal-to-handoff timing.

- Do not send project JSON, client names, file paths, or quote contents to generic
  analytics tools.
- Consent and opt-out behavior must match the applicable distribution and policy.
- Event schemas are versioned and have an owner.

---

## 14. Reliability and observability

### 14.1 Required signals

- request rate, latency, and error rate by endpoint class;
- authentication and refresh failure rates;
- billing webhook lag/failure and entitlement mismatch;
- project sync success, conflict, and queue age;
- asset scan/process duration and failure category;
- database/storage capacity, queue depth, and backup age;
- transactional-email delivery failure;
- release version and dependency health.

### 14.2 Service objectives

Formal SLO values require production usage evidence. Before pilot, define and
measure at least:

- API availability;
- authentication success latency;
- cloud revision durability;
- sync job completion;
- recovery point and recovery time objectives;
- incident acknowledgement for paid customers.

### 14.3 Operational rules

- Alerts must correspond to user impact or an impending failure.
- Logs use request/job IDs and structured fields.
- PII is minimized and redacted.
- Retries are bounded and dead-letter failures are inspectable.
- Health checks distinguish process health from dependency readiness.
- Status communication is prepared before a paid cloud launch.

- `OPS-001` — Every asynchronous job must be idempotent or detect prior completion.
- `OPS-002` — Every production release must be traceable to code and migration versions.
- `OPS-003` — Backups must be restored in a rehearsal, not merely reported successful.
- `OPS-004` — Critical billing, auth, sync, and asset failures require actionable alerts.

---

## 15. Environments, deployment, and migrations

### 15.1 Environments

| Environment | Purpose |
| --- | --- |
| Local | Fast development with disposable data and provider emulators where practical. |
| Test | Automated contract, integration, migration, and security-boundary tests. |
| Staging | Production-like validation with separate credentials and non-production billing mode. |
| Production | Customer data, controlled access, backups, alerts, and audited changes. |

Never share database credentials, signing keys, billing secrets, or object-storage
buckets between staging and production.

### 15.2 Deployment

- Infrastructure is reproducible and reviewed.
- Database migrations run as explicit versioned steps.
- Backward-compatible expand/migrate/contract changes are preferred.
- Desktop versions have a defined minimum-supported API window.
- Rollback plans account for irreversible data migrations.
- Feature flags are server-owned, typed, scoped, expiring, and not authorization.

### 15.3 Migration requirements

- Migrations must be tested from a representative prior snapshot.
- Long-running backfills are resumable and observable.
- Destructive column/object removal occurs only after old clients are outside the
  support window and data recovery is confirmed.
- Provider identifiers and webhook event history remain stable across migrations.

---

## 16. Testing strategy

### 16.1 Required test layers

| Layer | Examples |
| --- | --- |
| Unit | entitlement resolution, role matrix, state normalization, validation |
| Contract | API schemas, error codes, desktop compatibility, provider adapters |
| Integration | database transactions, object storage, queue, email, webhook replay |
| Security | tenant crossover, broken access control, token/session abuse, upload abuse |
| End-to-end | register → trial → desktop activation → cloud save → reopen |
| Recovery | restore backup, replay outbox, recover job, rotate key, provider outage |

### 16.2 Golden platform journeys

1. New owner registers, verifies, creates an organization, starts a trial, and
   activates the desktop.
2. Owner invites a sales designer, assigns a seat, and the designer opens the
   organization without gaining billing access.
3. Designer saves a project locally, synchronizes it, signs in on another
   authorized device, and opens the identical revision.
4. Two offline edits produce a visible preserved conflict rather than data loss.
5. An organization GLB and textures process into a validated catalog item and
   remain correctly authorized.
6. Payment failure enters grace, recovers after payment, and never harms files.
7. Owner exports organization data and support can trace the operation.

---

## 17. Delivery sequence

### Platform 0 — local commercial preparation (`CURRENT/HARDEN`)

- Keep local project save/reopen reliable.
- Define capability keys and licensing interfaces without fake server behavior.
- Finish legal/commercial provider decisions.
- Add no mandatory sign-in to the development build yet.

### Platform 1 — identity and licensing (`NEXT`)

- registration, verification, login, recovery, sessions;
- one organization per new owner;
- device activation;
- trial/subscription lookup and signed entitlements;
- secure desktop credential storage;
- minimum support diagnostics and audit.

### Platform 2 — teams and billing operations (`LATER` after Platform 1)

- invitations, roles, seats, billing admin separation;
- hosted checkout/portal and webhook processing;
- invoice/subscription view;
- admin tooling and entitlement explanation.

### Platform 3 — cloud projects (`LATER`)

- project metadata and immutable revision storage;
- upload/download intents;
- offline outbox and explicit conflict flow;
- restore, retention, export, and backup rehearsal.

### Platform 4 — organization asset catalog (`LATER`)

- quarantined upload and validation;
- GLB/texture processing and previews;
- stable versioned asset references;
- quotas, archive, retention, and diagnostics.

### Platform 5 — scale and enterprise controls (`RESEARCH`)

- MFA enforcement, SSO, SCIM, regional controls;
- advanced audit export and retention;
- approved integrations;
- real-time collaboration only if revision sync has earned trust.

---

## 18. Capability register

| Capability | Status | Evidence or next condition |
| --- | --- | --- |
| Local project workflow | `CURRENT` | Desktop repository behavior; remains Product Book governed. |
| Production hosted API | `NEXT` | Not present in repository. |
| Registration/login/recovery | `NEXT` | Platform 1. |
| Email verification | `NEXT` | Platform 1. |
| Secure desktop session storage | `NEXT` | Platform 1. |
| Organization and owner | `NEXT` | Minimal Platform 1 scope. |
| Device activation | `NEXT` | Platform 1. |
| Signed offline entitlements | `NEXT` | Platform 1. |
| Trial/subscription provider | `NEXT` | Provider decision and Platform 1. |
| Team invitations and RBAC | `LATER` | Platform 2. |
| Seat management | `LATER` | Platform 2. |
| Customer billing portal | `LATER` | Platform 2. |
| Cloud project revisions | `LATER` | Platform 3. |
| Conflict-preserving sync | `LATER` | Platform 3 release blocker. |
| Organization project export | `LATER` | Required before Platform 3 release. |
| Cloud GLB/texture catalog | `LATER` | Platform 4 and Product Book §36A. |
| Malware scan and asset processing | `LATER` | Platform 4 release blocker. |
| MFA | `LATER` | Required before enterprise positioning. |
| SSO/SCIM | `RESEARCH` | Demand-led. |
| Real-time collaboration | `RESEARCH` | Only after revision sync reliability. |
| Public asset marketplace | `EXCLUDED` | Not the cabinet-sales wedge. |
| Stored card processing | `EXCLUDED` | Billing-provider responsibility. |
| Cloud CNC execution | `EXCLUDED` | No verified machine contract. |

---

## 19. Open decisions

These decisions require short ADRs before Platform 1 implementation:

1. Deployment region and legal operating entity.
2. Identity approach: managed provider versus owned credential service.
3. Billing provider, currencies, tax responsibility, and refund policy.
4. Backend language/framework and relational database.
5. Object storage, queue, email, monitoring, and secret-management providers.
6. Trial duration, plan/seat model, device limits, and offline grace duration.
7. Data retention, backup RPO/RTO, and supported desktop/API window.
8. Whether local-only use exists after trial and exactly what limited mode permits.
9. Initial privacy jurisdictions and required agreements.

Open decisions do not authorize vendor-specific implementation by accident.

---

## 20. Definition of done for a platform capability

A capability is not `CURRENT` merely because an endpoint exists. It is done when:

- product behavior and ownership are defined;
- authorization is enforced server-side;
- request, error, retry, and idempotency contracts are documented;
- database and object migrations are reversible or safely recoverable;
- unit, integration, tenant-boundary, and journey tests pass;
- logs, metrics, alerts, and support diagnostics exist;
- security/privacy review is complete at the required risk level;
- failure and recovery behavior is demonstrated;
- user-facing copy and help are accurate;
- the capability is deployed and observed in its intended environment.

---

## 21. P0 implementation checklist

Only Platform 1 is the initial backend release scope.

- [ ] Resolve all Platform 1 open provider and policy decisions.
- [ ] Establish environments, migrations, secrets, CI, and deployment traceability.
- [ ] Implement registration, verification, login, refresh, logout, and recovery.
- [ ] Implement minimum organization owner and membership boundary.
- [ ] Implement trial/subscription normalization and verified webhooks.
- [ ] Implement capability-based entitlement resolution and signed snapshots.
- [ ] Store desktop sessions securely and support device activation/revocation.
- [ ] Implement audit events and minimum support diagnostics.
- [ ] Add rate limits, redaction, dependency scanning, and tenant-boundary tests.
- [ ] Pass the Platform 1 release gates below.

Cloud projects, team workflows, and cloud assets do not block Platform 1 unless
the release is marketed as containing them.

---

## 22. Release gates

### Gate A — contract and provider decisions

- Architecture and commercial ADRs are accepted.
- Capability keys, limited mode, grace, and device behavior are unambiguous.
- Privacy, terms, billing ownership, and support responsibilities are named.

### Gate B — identity safety

- Register, verify, login, refresh, logout, reset, revoke, and abuse tests pass.
- Desktop secrets are verified in secure storage.
- Account-existence and token leakage tests pass.

### Gate C — tenant isolation

- Cross-organization read/write tests cover every active resource type.
- Role changes and removals revoke access.
- Administrative actions are protected and audited.

### Gate D — commercial correctness

- Checkout/webhooks are verified, idempotent, replayed, and reconciled.
- Trial, active, past-due, grace, canceled, and recovery journeys pass.
- Effective entitlements can be explained from authoritative records.

### Gate E — offline trust

- Signed entitlement validation, expiry, grace, clock anomaly, and reconnect pass.
- Service loss does not corrupt, delete, or lock away local projects.
- Device-limit recovery is usable.

### Gate F — operability

- Production dashboards and actionable alerts exist.
- Backup restore and incident exercise succeed.
- Support can diagnose identity, billing, device, and entitlement problems safely.

### Future Gate G — cloud data trust

Required only when cloud projects/assets enter release scope:

- revision conflict preserves both versions;
- export, archive, restore, and deletion pass;
- untrusted asset upload is isolated and scanned;
- organization authorization and expiring URL tests pass;
- backup restore includes relational metadata and stored objects.

---

## 23. Final operating rule

The backend exists to make Cabinet Studio sellable, portable, recoverable, and
supportable. It must not become a reason to delay cabinet credibility, invent
fake cloud features, or endanger local customer work.

Build Platform 1 only when commercial launch needs it. Build cloud project and
asset services when their user value and operating cost are explicit. Claim a
capability only after its release gate has passed.
