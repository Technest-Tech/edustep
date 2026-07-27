# 08 — Decision Register

## 1. How to use this register

Each decision has:

- **Status:** accepted, proposed or open.
- **Default:** the assumption used in the blueprint.
- **Deadline:** the latest point it must be confirmed.
- **Impact:** what changes if the decision changes.

Open business decisions do not block preparation. The stated default allows
design to continue until the deadline.

---

## 2. Resolved/proposed technical decisions

| ID | Decision | Status | Rationale |
|---|---|---|---|
| ADR-001 | Laravel 13 backend | Proposed | Current supported Laravel release and requested stack |
| ADR-002 | Next.js App Router frontend | Proposed | Recommended modern Next.js architecture and requested stack |
| ADR-003 | PHP 8.4 and Node 24 LTS | Accepted | Verified local and container runtimes |
| ADR-004 | PostgreSQL 18 | Proposed | Relational integrity, transactions, reporting and current support |
| ADR-005 | Redis for queue/cache/locks | Proposed | Reliable async work and distributed coordination |
| ADR-006 | Modular monolith | Proposed | Best delivery and operational trade-off for current scale |
| ADR-007 | One organization, branch-ready | Proposed | Avoid premature SaaS complexity |
| ADR-008 | Same-origin reverse proxy | Proposed | Secure simple Sanctum session and minimal CORS |
| ADR-009 | Sanctum cookie auth | Proposed | Avoid browser JWT storage and use first-party session security |
| ADR-010 | REST `/api/v1` + OpenAPI | Proposed | Stable Laravel/Next contract and generated types |
| ADR-011 | ULID identifiers | Proposed | Public-safe sortable ids without sequence exposure |
| ADR-012 | Money in integer minor units | Accepted principle | Prevent floating-point financial errors |
| ADR-013 | UTC storage, Cairo display | Accepted principle | Correct scheduling and reporting |
| ADR-014 | Financial reversal, not deletion | Accepted principle | Explainable balances and audit |
| ADR-015 | PWA-responsive first | Proposed | Serves mobile roles without native-app cost |
| ADR-016 | Tailwind + owned shadcn/Radix UI | Proposed | Custom EduStep design with RTL/accessibility foundations |
| ADR-017 | Provider adapters | Proposed | Avoid coupling business rules to Paymob/Meta/WhatsApp SDK |
| ADR-018 | Outbox for reliable external effects | Proposed | Prevent lost or duplicate payment/message side effects |

These become accepted when the blueprint is approved.

---

## 3. Blocking before Sprint 1

## DEC-001 — Deployment ownership

- **Question:** Where will staging and production run?
- **Default:** Managed PostgreSQL/object storage with container-based web/API/workers.
- **Deadline:** Sprint 0.
- **Impact:** CI/CD, backups, same-origin proxy and cost.

## DEC-002 — Production domains

- **Question:** What domain/subdomain will host the application?
- **Default:** `app.<edustep-domain>` with `/api` reverse proxy.
- **Deadline:** Sprint 0.
- **Impact:** cookies, email links, PWA and TLS.

## DEC-003 — Launch organization and branches

- **Question:** Online-only, physical branch, or hybrid?
- **Default:** One organization with one online branch and branch-ready schema.
- **Deadline:** Sprint 0.
- **Impact:** rooms, calendar filters, attendance and reports.

## DEC-004 — Staff roles at launch

- **Question:** Which real people perform sales, operations, academics and finance?
- **Default:** Separate roles, even if one user holds several.
- **Deadline:** Sprint 0.
- **Impact:** permission seeds, dashboards and approval separation.

---

## 4. Blocking before CRM/admissions

## DEC-010 — Lead stages

- **Default:** New → assigned → contact attempt → contacted → qualified →
  placement booked → placement completed → trial/offer → awaiting payment →
  won/lost/deferred.
- **Deadline:** Before Sprint 2.
- **Impact:** reports, automation and required fields.

## DEC-011 — Lead response SLA

- **Default:** Configurable by working hours and source; no hard-coded target.
- **Deadline:** Before Sprint 2.
- **Impact:** warnings, dashboard and escalation.

## DEC-012 — Sources and campaign attribution

- **Default:** Meta, Instagram, Facebook, WhatsApp, referral, website, walk-in.
- **Deadline:** Before Sprint 2.
- **Impact:** import and marketing reports.

## DEC-013 — Placement rubric

- **Default:** Listening, speaking, reading, writing, vocabulary, grammar and
  pronunciation, with age/program-specific form versions.
- **Deadline:** Before Sprint 3.
- **Impact:** database template seed, screen and report.

## DEC-014 — Trial policy

- **Default:** Optional free/paid trial with configurable maximum.
- **Deadline:** Before Sprint 3.
- **Impact:** product, booking, attendance and conversion.

---

## 5. Blocking before groups and attendance

## DEC-020 — Launch programs

- **Default:** Kids first; teens/adults remain supported in catalog.
- **Deadline:** Before Sprint 4.
- **Impact:** navigation, demo seed, levels and rubrics.

## DEC-021 — Level naming and CEFR mapping

- **Default:** EduStep marketing name plus internal ordered sub-level and optional
  CEFR reference.
- **Deadline:** Before Sprint 4.
- **Impact:** curriculum, placement and parent reports.

## DEC-022 — Minimum/maximum group size

- **Default:** Configurable per group/program.
- **Deadline:** Before Sprint 4.
- **Impact:** capacity, waitlist and margin.

## DEC-023 — Session duration and recurrence

- **Default:** Per group, local Cairo wall time, sessions generated around
  academy holidays.
- **Deadline:** Before Sprint 4.
- **Impact:** calendar and payroll.

## DEC-024 — Attendance statuses

- **Default:** Present, late, excused absence, unexcused absence, early cancel,
  late cancel, academy cancellation and make-up attendance.
- **Deadline:** Before Sprint 5.
- **Impact:** session register, billing and make-up.

## DEC-025 — Make-up policy

- **Default:** Versioned policy per enrollment/product, with allowance, eligible
  absence, cancellation cutoff and expiry.
- **Deadline:** Before Sprint 5.
- **Impact:** credits, parent display and disputes.

## DEC-026 — Freeze and transfer policy

- **Default:** Manager-approved, effective-dated, with impact preview.
- **Deadline:** Before Sprint 6 if excluded from thin slice; before Sprint 5 if launch-critical.
- **Impact:** entitlement, invoices and scheduling.

---

## 6. Blocking before billing/payroll

## DEC-030 — Product models

- **Default:** Full-level fixed fee, monthly subscription and session package all
  supported by product type, but launch seed includes only actual used models.
- **Deadline:** Before Sprint 6.
- **Impact:** invoice, enrollment and balance calculations.

## DEC-031 — Enrollment activation rule

- **Default:** Configurable: full payment, first installment, or authorized
  override.
- **Deadline:** Before Sprint 6.
- **Impact:** seat confirmation and welcome.

## DEC-032 — Payment methods

- **Default:** Cash, bank transfer, InstaPay, wallet and payment gateway.
- **Deadline:** Before Sprint 6.
- **Impact:** verification, proof and reconciliation UI.

## DEC-033 — Discount approvals

- **Default:** Sales can request; owner/manager approves above configured limit.
- **Deadline:** Before Sprint 6.
- **Impact:** roles and offer/invoice workflow.

## DEC-034 — Refund/credit policy

- **Default:** No deletion; manager/finance request and privileged approval.
- **Deadline:** Before Sprint 6.
- **Impact:** ledger and support workflow.

## DEC-035 — Teacher pay models

- **Default:** Effective-dated fixed session/hour rate, with later extensions for
  per-student, percentage and salary-plus-extra.
- **Deadline:** Before Sprint 5.
- **Impact:** rate rule engine and statement.

## DEC-036 — Cancelled session teacher pay

- **Default:** Versioned rule by cancellation actor and notice window.
- **Deadline:** Before Sprint 5.
- **Impact:** session completion and earning.

## DEC-037 — Payroll periods

- **Default:** Monthly, review → approve → pay → lock.
- **Deadline:** Before Sprint 6/7.
- **Impact:** earning queries and closing.

## DEC-038 — Accounting integration

- **Default:** Operational finance and structured export only in v1.
- **Deadline:** Before pilot.
- **Impact:** chart-of-accounts mapping and export.

---

## 7. Integrations

## DEC-040 — Meta access

- **Default:** Manual/CSV lead intake until Meta test application and form access
  are available.
- **Deadline:** Credentials before E2-08 implementation.
- **Impact:** integration sprint only; core CRM is not blocked.

## DEC-041 — WhatsApp provider

- **Default:** Direct WhatsApp Business Platform evaluation first; outbound
  essential templates before two-way inbox.
- **Deadline:** Before communication integration sprint.
- **Impact:** template approval, message pricing and webhook.

## DEC-042 — Payment gateway

- **Default:** Evaluate Paymob first with manual payment fully supported.
- **Deadline:** Before E8-10.
- **Impact:** adapter, sandbox and reconciliation.

## DEC-043 — Live class platform

- **Default:** Store manual Zoom/Google Meet link in v1.
- **Deadline:** Before Sprint 4.
- **Impact:** automated meeting creation only.

## DEC-044 — Email provider

- **Default:** Transactional email adapter selected with deployment platform.
- **Deadline:** Before Sprint 7.
- **Impact:** sending domain and delivery callbacks.

---

## 8. UX and content decisions

## DEC-050 — Active brand direction

- **Default:** Current EduStep navy/teal/yellow system and Alexandria/Manrope.
- **Deadline:** Sprint 0 design gate.
- **Impact:** tokens, components and portal.

## DEC-051 — Arabic terminology

- **Default:** Egyptian-friendly Arabic for family, concise Modern Arabic for
  staff labels, English technical abbreviations only where familiar.
- **Deadline:** Before component copy freeze.
- **Impact:** translation dictionary and training.

## DEC-052 — Parent portal release

- **Default:** Pilot-ready v1, after internal operations are stable.
- **Deadline:** End Sprint 4 review.
- **Impact:** Sprint 7 scope.

## DEC-053 — Student direct login

- **Default:** Guardian-first for children; adult learners use self account.
- **Deadline:** Before Sprint 7.
- **Impact:** role and navigation.

---

## 9. Decisions explicitly deferred

- Native mobile application.
- Full LMS/content authoring.
- AI lead scoring.
- AI academic recommendations.
- Multi-tenant SaaS.
- Marketplace.
- Biometric attendance.
- Advanced inventory/library.
- Full statutory accounting.

Deferred items need a new evidence-based decision after pilot; they are not
assumed roadmap commitments.

---

## 10. Blueprint approval record

Approval should record:

- Product owner.
- Technical owner.
- Academic owner.
- Operations owner.
- Finance owner.
- Approval date.
- Accepted exceptions.
- Decisions with a scheduled follow-up.

After approval, changes are recorded as new ADR/decision entries rather than
silently editing the original rationale.
