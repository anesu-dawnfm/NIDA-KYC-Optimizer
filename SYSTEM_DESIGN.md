# KYC Optimizer System Design

## 1. Purpose And Status

KYC Optimizer is an offline-first KYC capture and review platform for regulated
banking operations. This document is the authoritative architecture baseline.

**Architecture decision:** conditionally approved for implementation.

The selected mobile stack is suitable, but direct mobile or browser access to
production Supabase services is rejected. Production requires a bank-controlled
API and application-service boundary.

## 2. Architecture Goals

- Operate reliably during extended or intermittent connectivity.
- Minimize storage and exposure of customer identity data.
- Keep OCR and initial parsing on-device.
- Prevent duplicate, lost, or silently overwritten submissions.
- Enforce authorization independently of client behavior.
- Produce complete, immutable, and reviewable audit trails.
- Support controlled scaling, recovery, retention, and provider exit.

## 3. Context And Trust Boundaries

```text
[Untrusted Device Environment]
Mobile App
  - Camera and quality checks
  - On-device OCR
  - Parser and validation
  - SQLCipher working store
  - Transactional sync engine
             |
             | TLS + short-lived token + idempotency/correlation IDs
             v
[Bank-Controlled Trust Boundary]
API Gateway / WAF
  - Authentication and token validation
  - Device/application integrity signals
  - Schema validation, rate limiting, and request controls
             |
             v
KYC Application Services
  - Sync and conflict resolution
  - Workflow and authorization
  - Document handling
  - Validation/screening integrations
  - Immutable audit events
             |
       +-----+-----+
       |           |
       v           v
PostgreSQL       Encrypted Object Storage
Metadata         Document binaries

[Bank-Controlled User Environment]
Next.js Dashboard -> server-side application services -> KYC platform
```

### Mandatory Trust Decisions

- Mobile devices, OCR output, browser sessions, and network requests are
  untrusted.
- API/application services are the primary authorization boundary.
- PostgreSQL RLS is mandatory defense-in-depth, not a replacement for services.
- Service-role and privileged database credentials are server-side only.
- The dashboard browser never accesses production database tables directly.

## 4. Component Responsibilities

### Mobile Application

| Component | Responsibility |
|---|---|
| Scanner | Capture images and enforce quality thresholds |
| OCR | Run ML Kit on-device and return structured text/confidence |
| Parser | Apply deterministic, versioned document rules |
| Validation | Check formats, consistency, and required confirmations |
| Storage | Persist encrypted drafts and sync metadata |
| Sync | Deliver idempotent mutations and receive server outcomes |
| Submission | Enforce workflow transitions and correction rules |

Expo Router handles navigation. Zustand holds transient UI/workflow state only.
Business records remain in SQLite and application services.

### API Gateway And Services

- Authenticate users and validate short-lived tokens.
- Apply rate limits, request size limits, schemas, and threat controls.
- Enforce role, branch, assignment, purpose, and record-level authorization.
- Process idempotency keys and correlation IDs.
- Resolve sync conflicts using explicit workflow rules.
- Store metadata and documents in the correct systems.
- Emit immutable audit events for security and workflow changes.
- Integrate with approved KYC, AML, screening, and core banking services.

### Data Platform

- PostgreSQL stores structured metadata, workflow state, sync versions, and
  references to documents.
- Approved encrypted object storage holds document binaries.
- RLS and least-privilege roles are deny-by-default.
- Analytics use approved views/read models with minimized or de-identified data.
- Production hosting requires approved residency, backup, audit, and exit terms.

### Dashboard

- Next.js uses bank SSO, MFA, and least-privilege RBAC/ABAC.
- Sensitive queries and mutations execute through server-side services.
- Reviewer decisions require reason codes and immutable audit events.
- Export and bulk-access capabilities require explicit privilege and monitoring.

## 5. Mobile Folder Architecture

```text
src/
  core/
    api/
    auth/
    config/
    constants/
    database/
    security/
    theme/
    hooks/
    utils/
  features/
    scanner/
    ocr/
    parser/
    validation/
    storage/
    sync/
    submission/
  shared/
    components/
    services/
    types/
  app/
    (tabs)/
    scan/
    results/
    settings/
```

Each feature may contain `components`, `hooks`, `services`, `types`,
`repositories`, and `schemas`. UI and route files must not contain persistence,
sync, OCR parsing, or authorization logic.

## 6. Offline-First Design

### Local Data Ownership

- SQLite is the authoritative working store while offline.
- The server is authoritative once a record is submitted.
- A submitted record cannot be silently edited locally. Corrections create an
  explicit, auditable workflow.
- Each record uses a device-generated UUID/ULID and a monotonic version.

### Required Local Records

| Record | Purpose |
|---|---|
| `kyc_draft` | Current encrypted working record and workflow state |
| `document_ref` | Temporary file reference, hash, type, and expiry |
| `outbox` | Atomic queue of pending idempotent mutations |
| `inbox` | Applied server messages/results for replay protection |
| `sync_checkpoint` | Last confirmed server checkpoint |
| `sync_error` | Sanitized failure state and retry metadata |
| `audit_event` | Required local workflow/security events pending upload |

### State Model

```text
draft
  -> ready_to_sync
  -> syncing
  -> submitted
  -> accepted | rejected | manual_review
  -> correction_required
```

Transitions must be explicit and validated. Terminal or server-owned states
cannot be overwritten by generic client updates.

### Sync Protocol

Every mutation contains:

- Idempotency key
- Correlation ID
- Record ID and expected version
- Actor/device context
- Operation type
- Payload schema version
- Payload/document hash

The client persists the domain update and outbox entry in one transaction. The
server stores the idempotency result before acknowledgement. Retries use bounded
exponential backoff with jitter. Duplicate, delayed, and reordered messages must
produce the same final result.

Timestamp-only synchronization and generic last-write-wins are prohibited.
Conflicts return an explicit outcome and require deterministic resolution or
manual review.

## 7. Local Storage And Encryption

- Enable SQLCipher for Android and iOS production builds.
- Generate a random per-installation database key.
- Protect the database key with Secure Store using device-bound,
  user-protected accessibility settings.
- Secure Store contains keys and short-lived credentials only.
- Use parameterized SQL and versioned forward-only migrations.
- Encrypt temporary document files separately from the database.
- Delete temporary documents after confirmed upload or policy expiry.
- Exclude sensitive local data from device/cloud backup where required.
- Force re-authentication and restrict offline access after the approved maximum
  offline period.

Secure Store is not a source of truth for irreplaceable records. Key
invalidation, biometric changes, reinstall behavior, and recovery paths must be
tested on real devices.

## 8. OCR And Document Processing

### Processing Flow

```text
Capture
  -> Quality checks
  -> On-device ML Kit OCR
  -> Versioned parser
  -> Deterministic validation
  -> User/operator confirmation
  -> Encrypted persistence
  -> Submission/manual review
```

### Controls

- No cloud OCR APIs.
- Reject images that fail blur, glare, crop, orientation, or resolution checks.
- Treat OCR output as untrusted input.
- Record OCR confidence, parser version, corrections, and source linkage.
- Validate document formats, dates, checksums, and cross-field consistency where
  available.
- Require confirmation for critical identity fields.
- Route low-confidence or inconsistent results to manual review.
- Never auto-approve KYC based only on OCR output.

The ML Kit bridge/config plugin is an owned native dependency. Every Expo SDK,
React Native, Android, iOS, or ML Kit upgrade requires compatibility and accuracy
testing.

## 9. Security Architecture

### Identity And Access

- Use bank-approved OAuth2/OIDC.
- Use short-lived access tokens, refresh-token rotation, revocation, and MFA.
- Enforce least privilege using role, branch, assignment, purpose, and record
  context.
- Protect privileged dashboard operations with step-up authentication where
  required.

### Application And Device

- Use development/native builds; Expo Go is not a production target.
- Evaluate root/jailbreak, emulator, tampering, and application-integrity signals.
- Apply screen-capture restrictions to sensitive screens where supported.
- Govern and sign binaries and OTA updates.
- Do not rely on device signals as the sole authorization control.

### API And Data

- Enforce TLS, schema validation, rate limits, request limits, and replay
  controls.
- Keep secrets in approved secret-management systems.
- Encrypt data in transit and at rest; manage key ownership and rotation.
- Test deny-by-default RLS policies and database privileges in CI.
- Store documents outside PostgreSQL and verify hashes during transfer.

### Logging And Audit

- Never log tokens, secrets, raw OCR text, document images, or customer PII.
- Use centralized redaction utilities and prohibited-field tests.
- Emit immutable events containing actor, action, target, timestamp, correlation
  ID, reason, and outcome.
- Forward approved security events to the bank SIEM.
- Metrics and traces must use non-sensitive identifiers.

### Secure Delivery

- Threat modelling and privacy review are required for material changes.
- Generate and monitor an SBOM.
- Scan dependencies, source, secrets, containers, and infrastructure.
- Perform mobile, API, dashboard, and authorization penetration testing.
- Separate development, test, and production environments and credentials.

## 10. Compliance And Data Governance

The solution requires formal review against:

- Tanzania Personal Data Protection Act, 2022 and applicable regulations
- Bank of Tanzania cybersecurity, outsourcing, cloud, operational-resilience,
  AML/KYC, audit, and retention requirements
- Stanbic/Standard Bank Group information-security and third-party-risk policies

Before managed Supabase or any cloud service is approved, document:

- Data location and all cross-border processing
- Controller, processor, and subprocessor responsibilities
- Lawful purpose, notices, consent where applicable, and data-subject handling
- Encryption, key ownership, support access, and privileged access
- Audit-log availability and retention
- Backup locations, restoration tests, RPO, and RTO
- Incident and breach notification obligations
- Regulator and audit access
- Retention, legal hold, deletion, and provider exit procedures

Each collected field and document must have a documented purpose, owner,
classification, retention period, and deletion rule. A data protection impact
assessment is mandatory before production.

## 11. Scalability And Resilience

- Keep API services stateless where practical and horizontally scalable.
- Use idempotent asynchronous processing for document and screening workflows.
- Index PostgreSQL by tenant/branch, workflow state, assignment, and sync version
  based on measured queries.
- Partition or archive high-volume audit/workflow data according to retention.
- Use read models or approved analytical views for dashboard workloads.
- Do not store document binaries in PostgreSQL.
- Apply connection pooling, query timeouts, backpressure, and rate limits.
- Define and test service-level objectives, capacity limits, and degradation
  modes.
- Test backup restoration and disaster recovery against approved RPO/RTO.
- Maintain a provider exit and data-portability plan.

## 12. Principal Risks And Mitigations

| Risk | Severity | Required Mitigation |
|---|---|---|
| Direct client access to Supabase | Critical | Bank-controlled API/service boundary |
| KYC exposure on lost/rooted device | Critical | SQLCipher, device-protected keys, minimal retention, revocation |
| Unapproved cross-border processing | Critical | Residency/DPIA/outsourcing approval before production |
| Incorrect OCR creates bad records | High | Quality gates, confidence rules, validation, confirmation/review |
| Duplicate or conflicting offline submissions | High | Transactional outbox, idempotency, versions, workflow state machine |
| RLS or privilege misconfiguration | High | Deny-by-default policies, CI tests, service authorization |
| PII leakage into logs/tools | High | Redaction utilities, prohibited-field tests, approved tooling |
| Native/Expo/ML Kit incompatibility | Medium | Owned bridge, pinned versions, upgrade certification |
| Database degraded by document storage | High | Encrypted object storage and metadata-only PostgreSQL |
| Dashboard account compromise | High | Bank SSO, MFA, PAM/step-up controls, immutable audit |
| Provider outage or lock-in | High | DR tests, portability, exit plan, approved service commitments |

## 13. Verification Strategy

- Unit tests: parsers, validators, state machine, conflict rules, and redaction.
- Integration tests: migrations, SQLCipher, API contracts, RLS, idempotency, and
  audit events.
- Sync tests: offline, intermittent, replayed, duplicated, delayed, reordered,
  and partially uploaded operations.
- Device tests: Secure Store, biometrics, camera, SQLCipher, ML Kit, reinstall,
  and key invalidation on real Android/iOS devices.
- Security tests: authorization bypass, injection, token revocation, tampering,
  rooted/jailbroken devices, and sensitive logging.
- OCR benchmark: representative Tanzanian documents, devices, lighting, wear,
  languages, and operator workflows.
- Resilience tests: backup restore, regional/provider failure, queue backlog, and
  approved RPO/RTO.

## 14. Production Approval Gates

Production release requires evidence of:

1. Approved hosting, data-residency, cross-border, and third-party-risk model.
2. Completed threat model and data protection impact assessment.
3. Proven deterministic offline sync under failure, replay, and conflict.
4. Approved OCR accuracy targets and representative benchmark results.
5. Security architecture review and penetration-test sign-off.
6. Tested backup restoration, disaster recovery, retention, and secure deletion.
7. Approved identity, authorization, audit, SIEM, and incident-response controls.
8. Documented operating model, support ownership, and provider exit plan.
