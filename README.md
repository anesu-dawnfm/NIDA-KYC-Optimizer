# KYC Optimizer

KYC Optimizer is an offline-first mobile KYC capture and review platform for
regulated banking environments. It captures identity documents, performs
on-device OCR, validates extracted fields, securely stores work during
connectivity outages, and synchronizes submissions through bank-controlled
services.

The solution is designed for data minimization, deterministic synchronization,
strong authorization, and complete auditability. OCR assists data capture but
never independently approves a customer.

## Architecture Status

**Conditionally approved for implementation.**

Production release remains blocked until data residency, cloud outsourcing,
security architecture, OCR accuracy, penetration testing, and disaster recovery
have received formal approval.

## Technology Stack

### Mobile

- React Native and Expo development builds
- TypeScript
- Expo Router
- Zustand for transient UI state
- Axios through a typed API client
- Google ML Kit on-device OCR
- Expo SQLite with SQLCipher
- Expo Secure Store for keys and short-lived credentials

### Platform

- Bank API Gateway/WAF
- KYC application and synchronization services
- PostgreSQL/Supabase as an approved managed or bank-controlled data platform
- Encrypted object storage for document binaries
- Row Level Security as defense-in-depth

### Dashboard

- Next.js
- TailwindCSS
- TypeScript
- Bank SSO, MFA, and server-side data access

## High-Level Architecture

```text
Mobile Application
  -> Capture and image-quality checks
  -> On-device ML Kit OCR
  -> Deterministic parsing and validation
  -> SQLCipher encrypted working store
  -> Transactional outbox sync
  -> Bank API Gateway / WAF
  -> KYC application services
  -> PostgreSQL metadata + encrypted object storage
  -> Next.js compliance dashboard through server-side services
```

Mobile and browser clients must not connect directly to production Supabase
tables. The API gateway and application services are the primary trust and
authorization boundary.

## Core Design Decisions

- SQLite is the mobile system of record while offline.
- The server becomes authoritative after submission.
- Sync mutations are versioned, idempotent, and auditable.
- Secure Store protects keys and credentials, not KYC payloads.
- Document images are temporary on-device and encrypted in approved object
  storage after upload.
- OCR output is treated as untrusted input and requires deterministic validation.
- Sensitive data is excluded from logs, analytics, crash reports, URLs, and
  notifications.

## Mobile Project Structure

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

Business logic belongs in feature services, repositories, schemas, and hooks.
UI components and Expo Router files must remain thin.

## Offline Workflow

1. Capture a document and reject poor-quality images before OCR.
2. Run ML Kit OCR entirely on-device.
3. Parse and validate extracted fields using versioned rules.
4. Require confirmation for critical identity fields.
5. Persist the draft and sync intent atomically in encrypted SQLite.
6. Upload through the bank API using an idempotency key and correlation ID.
7. Verify server acknowledgement before deleting temporary document files.
8. Treat accepted submissions as server-authoritative.

The sync engine uses transactional outbox/inbox records, explicit checkpoints,
bounded retries, and deterministic conflict handling. Timestamp-only sync and
generic last-write-wins are prohibited.

## Security Baseline

- SQLCipher database encryption with a per-installation key protected by Secure
  Store
- Short-lived tokens, refresh-token rotation, MFA, and revocation
- Server-side authorization for every operation
- Deny-by-default PostgreSQL privileges and RLS policies
- PII redaction for logs and telemetry
- Immutable workflow and security audit events
- Root/jailbreak and application-integrity signals
- Signed, governed application and OTA releases
- Dependency scanning, SBOM generation, threat modelling, and penetration tests

## Compliance Baseline

Implementation and production deployment require formal review against:

- Tanzania Personal Data Protection Act, 2022 and applicable regulations
- Bank of Tanzania cybersecurity, outsourcing, cloud, operational-resilience,
  AML/KYC, audit, and retention requirements
- Stanbic/Standard Bank Group security and third-party-risk policies

Any managed Supabase deployment requires written approval for data residency,
cross-border processing, subprocessors, key ownership, audit access, backups,
incident notification, regulator access, and exit arrangements.

## Documentation

- `AGENTS.md`: mandatory coding and implementation rules
- `SYSTEM_DESIGN.md`: authoritative architecture, security, sync, risk, and
  approval decisions

## Local Development

Requirements:

- Node.js 22 or the version approved by the delivery pipeline
- Android Studio or Xcode for native development builds

Create a local environment file from `.env.example`. All `EXPO_PUBLIC_*`
variables are bundled into the application and must never contain secrets.

```bash
npm install
npm run typecheck
npm run lint
npm run android
```

The project uses Expo development builds because planned SQLCipher and ML Kit
native integrations are not compatible with an Expo Go-only workflow.

## Implementation Gates

Before production release, the project must demonstrate:

1. Approved hosting, data-residency, and third-party-risk model.
2. Completed threat model and data protection impact assessment.
3. Proven offline synchronization under failure and replay conditions.
4. OCR accuracy benchmark using representative Tanzanian documents.
5. Security architecture review and penetration-test sign-off.
6. Tested backup restoration, disaster recovery, retention, and secure deletion.
