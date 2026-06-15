# AGENTS.md

This file defines mandatory implementation rules for all contributors and coding
agents working on KYC Optimizer. `SYSTEM_DESIGN.md` is the authoritative
architecture document. Do not introduce designs that conflict with it.

## Delivery Status

The architecture is conditionally approved for implementation. Production
release is blocked until the security, compliance, data-residency, OCR accuracy,
and disaster-recovery gates in `SYSTEM_DESIGN.md` are complete.

## Technology Constraints

### Mobile Application

- React Native with Expo development builds
- TypeScript with strict mode enabled
- Expo Router for navigation only
- Zustand for transient UI and workflow state only
- Axios through the typed API client in `src/core/api`
- No Expo Go dependency for production features

### OCR

- Google ML Kit through a maintained React Native bridge/config plugin
- On-device processing only
- No cloud OCR APIs
- OCR output is untrusted input and cannot automatically approve KYC

### Local Storage

- Expo SQLite with SQLCipher enabled
- Expo Secure Store for encryption keys and short-lived credentials only
- No KYC payloads, document images, or large values in Secure Store
- No sensitive data in AsyncStorage

### Backend

- Mobile and browser clients must use the bank-controlled API gateway and
  application services
- Clients must not connect directly to Supabase/PostgreSQL in production
- Supabase service-role keys must never appear in client or browser bundles
- PostgreSQL with deny-by-default privileges and Row Level Security as
  defense-in-depth
- Document binaries belong in approved encrypted object storage, not PostgreSQL

### Dashboard

- Next.js, TailwindCSS, and TypeScript
- Bank SSO, MFA, and least-privilege role enforcement
- Browser code must not hold privileged database credentials
- Data access must occur through server-side application services

## Architecture Principles

- Offline-first, with SQLite as the mobile working store
- Server-authoritative after a record is submitted
- Type-safe contracts across mobile, API, database, and dashboard
- Minimal dependencies and controlled native modules
- Least privilege, defense-in-depth, and auditable actions
- Data minimization and explicit retention
- Idempotent operations and deterministic synchronization
- Business logic outside UI components and route files

## Required Mobile Structure

Use feature-first architecture:

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

Each feature should contain only the folders it needs from:

```text
components/
hooks/
services/
types/
repositories/
schemas/
```

## Mandatory Implementation Rules

### UI And State

- Route files and components may orchestrate use cases but must not contain
  persistence, OCR parsing, sync, authorization, or validation business logic.
- Zustand must not be the system of record for KYC data.
- Never persist tokens or sensitive records through Zustand persistence.

### Database And Encryption

- Enable SQLCipher for Android and iOS production builds.
- Generate a random per-installation database key and protect it with Secure
  Store using device-bound, user-protected accessibility settings.
- Use versioned, forward-only migrations.
- Use parameterized SQL. Never interpolate user or OCR input into SQL.
- Store hashes, identifiers, sync metadata, and required KYC fields only.
- Temporary document files must be encrypted and deleted after upload or expiry.

### Synchronization

- Use transactional `outbox`, `inbox`, `sync_checkpoint`, and `sync_error`
  records.
- Generate UUID/ULID identifiers on-device.
- Every mutation must include an idempotency key, record version, and correlation
  ID.
- Do not implement timestamp-only sync or generic last-write-wins.
- Retry transient failures with bounded exponential backoff and jitter.
- Treat submitted records as server-authoritative and immutable on-device except
  through an explicit correction workflow.

### API And Authorization

- All network calls must use the typed API client.
- Validate request and response schemas at trust boundaries.
- Use short-lived access tokens and refresh-token rotation.
- Authorization must be enforced server-side for every operation.
- RLS policies must be deny-by-default and tested in CI.
- Never log secrets, tokens, document images, raw OCR text, or customer PII.

### OCR And Validation

- Run image-quality checks before OCR: blur, glare, cropping, orientation, and
  minimum resolution.
- Store OCR confidence, parser version, correction history, and source linkage.
- Parse documents with deterministic, versioned rules.
- Require user/operator confirmation for critical identity fields.
- Route low-confidence or inconsistent results to manual review.

### Audit And Observability

- Security-sensitive and workflow-changing actions require immutable audit
  events containing actor, action, record ID, timestamp, correlation ID, and
  outcome.
- Logs and telemetry must use approved redaction utilities.
- Operational metrics must not contain customer PII.
- Security events must be suitable for forwarding to the bank SIEM.

## Testing Requirements

- Unit-test parsers, validators, conflict rules, redaction, and state machines.
- Integration-test database migrations, encrypted storage, API contracts, RLS,
  retries, and idempotency.
- Test offline, intermittent, duplicated, delayed, and reordered requests.
- Test on real Android and iOS devices for Secure Store, SQLCipher, biometrics,
  camera, and ML Kit behavior.
- Maintain representative Tanzanian identity-document OCR benchmarks.
- Add security tests for authorization bypass, injection, sensitive logging,
  rooted/jailbroken device handling, and token revocation.

## Prohibited Patterns

- Direct mobile or browser access to production Supabase tables
- Service-role or privileged keys in mobile, web, repository, or CI logs
- Cloud OCR or unapproved analytics/crash tools receiving KYC data
- Raw document images stored unencrypted or retained indefinitely
- Automatic KYC approval based only on OCR output
- Silent conflict resolution that overwrites submitted records
- Sensitive values in URLs, logs, notifications, or screenshots

## Definition Of Done

A change is not complete until:

- Type checking, linting, and relevant tests pass.
- Threat, privacy, retention, audit, and offline impacts are considered.
- New data fields have a documented purpose, owner, and retention rule.
- API and database authorization changes include negative tests.
- Architecture-impacting changes update `SYSTEM_DESIGN.md`.
