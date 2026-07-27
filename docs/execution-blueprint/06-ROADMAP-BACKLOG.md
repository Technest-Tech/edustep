# 06 — Delivery Roadmap and Product Backlog

## 1. Delivery model

Work proceeds as vertical slices. Each slice includes:

- UX.
- Laravel business logic and API.
- Next.js interface.
- Permissions.
- Audit.
- Automated tests.
- Demo data.
- Documentation.

Backend and frontend are not developed as two long isolated projects.

### Sprint assumptions

- Two-week sprints.
- Dedicated product/UX ownership.
- At least one backend and one frontend engineer.
- QA involved from Sprint 1.
- Shared DevOps support.

With one engineer, the same sequence remains but duration increases. Dates are
not committed until team capacity and business-policy decisions are confirmed.

---

## 2. Milestones

| Milestone | Outcome | Expected boundary |
|---|---|---|
| Blueprint approved | Architecture, UX and backlog ready | Before Sprint 0 closes |
| Internal foundation | Secure login, roles, shell and deployment | Sprint 1 |
| CRM alpha | Leads and people managed without spreadsheet | Sprint 2 |
| Admissions alpha | Placement, offer and conversion | Sprint 3 |
| Operations alpha | Groups, sessions and enrollment | Sprint 4 |
| Classroom alpha | Teacher attendance/report and earning | Sprint 5 |
| Operational thin slice | Lead to paid active learner works | Sprint 6 |
| Pilot-ready v1 | Progress, portals, hardening and recovery | Sprint 8 |

---

## 3. Sprint sequence

## Sprint 0 — Product and design foundation

### Goal

Remove policy ambiguity and prepare tested UX before feature coding.

### Deliverables

- Confirm program and launch audience.
- Confirm lead stages and ownership.
- Confirm placement rubric v1.
- Confirm pricing and payment models.
- Confirm absence, make-up, freeze, transfer and refund rules.
- Confirm teacher rate models.
- Confirm roles and branch scope.
- Low-fidelity golden-path wireframes.
- Interactive prototype of six critical screens.
- Approved design tokens and component direction.
- Final v1 release scope.
- Data import sample and mapping.
- Environment/hosting decision.

### Exit gate

- No blocking policy decision remains for Sprint 1–2.
- Prototype critical issues resolved.
- Backlog has acceptance criteria.

## Sprint 1 — Platform foundation

### Goal

Create a secure, deployable skeleton that proves the complete technical path.

### Deliverables

- Monorepo structure.
- Local Docker environment.
- Laravel and Next.js applications.
- PostgreSQL and Redis.
- Same-origin reverse proxy.
- Sanctum login/logout/reset.
- User/role/permission/branch foundation.
- Staff app shell and RTL foundation.
- Current-user/permission contract.
- Audit/request-id foundation.
- OpenAPI generation workflow.
- CI pipeline.
- Staging deployment.
- Health checks and structured logs.

### Demo

Owner creates/invites staff users; each role logs in and sees only allowed
navigation.

## Sprint 2 — CRM and people

### Goal

Run lead follow-up and create clean family/student/teacher records.

### Deliverables

- Lead create/import/search.
- Dedupe warning by phone/email.
- Lead stages, owner and next action.
- Kanban and list.
- Activities, notes and tasks.
- SLA indicator.
- Lost/deferred reason.
- Household, guardian and student basic profiles.
- Teacher basic profile and status.
- Global search.
- Permission and audit coverage.
- CRM dashboard basics.

### Demo

Counselor receives a lead, records contact, schedules follow-up, finds a
duplicate and creates a household with two prospective learners.

## Sprint 3 — Placement, offer and conversion

### Goal

Turn a qualified lead into a recommended, offered learner record.

### Deliverables

- Assessor availability and placement calendar.
- Book/confirm/reschedule/no-show.
- Placement rubric and draft autosave.
- Result and recommended level.
- Trial booking and attendance.
- Offer builder and validity.
- Suitable-group placeholder/query contract.
- Idempotent lead conversion.
- Conversion to existing or new household/student.
- Admission metrics.

### Demo

A parent books a free placement; the assessor publishes a result; the counselor
creates an offer and converts without duplicate data.

## Sprint 4 — Academic catalog, groups and sessions

### Goal

Create the operational teaching structure.

### Deliverables

- Programs, levels and course version.
- Units/lessons/outcomes baseline.
- Group create/edit/status.
- Recurring schedule rules.
- Session generation around holidays.
- Master calendar.
- Teacher/room conflict check.
- Capacity and waitlist.
- Enrollment draft and seat reservation.
- Group 360 and roster.
- Operations dashboard basics.

### Demo

Operations creates a level/group, assigns a teacher, generates sessions, catches
a conflict and reserves a student seat.

## Sprint 5 — Classroom operations and teacher earnings

### Goal

Run real sessions from a teacher’s phone.

### Deliverables

- Teacher Today and schedule.
- Session roster.
- Attendance statuses.
- Session report.
- Complete/reopen control.
- Make-up credit baseline.
- Substitute assignment.
- Teacher rate rules and effective dates.
- Earning generation from completed session.
- Missing-report queue.
- Parent-visible session summary data.

### Demo

Teacher marks attendance and completes the report in under a minute; absence
grants the correct make-up credit; earning appears with a traceable calculation.

## Sprint 6 — Billing and collection

### Goal

Complete the lead-to-paid-enrollment thin slice.

### Deliverables

- Products and price lists.
- Enrollment price snapshot and discount approval baseline.
- Invoice draft/issue.
- Installment schedule.
- Manual payment and proof.
- Payment verification and allocation.
- Household ledger.
- Receipt.
- Enrollment activation from payment rule.
- Due/overdue collection queue.
- Void/credit/refund baseline.
- Finance dashboard.

### Demo

Finance records partial then final payment, explains the balance, activates the
enrollment and issues a receipt without duplicate effects.

## Sprint 7 — Progress and portals

### Goal

Make progress visible and reduce manual family/teacher support.

### Deliverables

- Assessment templates and scoring.
- Skill progress view.
- Risk signals and intervention.
- Report card draft/publish.
- Teacher assessment task list.
- Family login and child switcher.
- Family schedule, attendance, progress and billing.
- Family service request.
- PWA manifest and installability baseline.
- Essential transactional email.

### Demo

Guardian switches between two children, sees the next session, attendance,
progress report and invoice, then opens a contextual request.

## Sprint 8 — Pilot hardening and release

### Goal

Make the system safe and supportable for a real pilot.

### Deliverables

- Role matrix completion.
- Privileged 2FA.
- Data import tooling and dry run.
- Export and backup/restore test.
- Performance and query review.
- Golden-path Playwright suite.
- Accessibility review.
- Mobile-device validation.
- Error and queue monitoring.
- Operational runbooks.
- Staff training material.
- Pilot migration.
- Go/no-go review.

### Demo

Full golden path with imported pilot data, simulated provider failure, restore
evidence and all release gates passed.

---

## 4. Epic backlog

Priority:

- **P0** required for operational thin slice.
- **P1** required for pilot-ready v1.
- **P2** valuable after pilot.

## E0 — Platform and delivery

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E0-01 | P0 | Reproducible local environment | New developer starts API/web/database/Redis from documented commands |
| E0-02 | P0 | Staging environment | Main branch deployment produces health-checked staging |
| E0-03 | P0 | API contract generation | Frontend types generated and contract drift fails CI |
| E0-04 | P0 | Request correlation | UI error can be matched to API/job logs by request id |
| E0-05 | P1 | Feature flags | Pilot feature can be enabled by environment/role safely |

## E1 — Identity and access

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E1-01 | P0 | Staff login/logout | Secure session, rotation, throttling and logout |
| E1-02 | P0 | Invite staff | Authorized manager invites user with role and branch |
| E1-03 | P0 | Permission enforcement | API policy tests cover allowed and denied cases |
| E1-04 | P0 | Branch scope | Staff cannot fetch records outside branch scope |
| E1-05 | P1 | 2FA | Privileged user enrolls, confirms and recovers safely |
| E1-06 | P1 | Session management | User views and revokes other sessions |

## E2 — CRM

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E2-01 | P0 | Capture lead | Lead stores contact, learner, source and campaign |
| E2-02 | P0 | Detect duplicate | Normalized phone/email warns and offers review |
| E2-03 | P0 | Assign and stage lead | Owner/stage history and permissions enforced |
| E2-04 | P0 | Record activity | Call/WhatsApp/note becomes timeline event |
| E2-05 | P0 | Next action | Active lead cannot disappear without due follow-up |
| E2-06 | P0 | Follow-up queue | Counselor sees overdue and today work |
| E2-07 | P0 | Close lead | Won/lost/deferred reason is reportable |
| E2-08 | P1 | Meta intake | Signed/replayed webhook creates one attributed lead |
| E2-09 | P2 | Lead automation | Configured triggers create tasks/messages |

## E3 — People

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E3-01 | P0 | Household profile | Multiple guardians/students supported |
| E3-02 | P0 | Student 360 | Current group, timeline, attendance and status visible |
| E3-03 | P0 | Teacher profile | Status, eligibility, availability and documents |
| E3-04 | P0 | Link portal user | Guardian/teacher access derived from person relation |
| E3-05 | P1 | Consent evidence | Policy version, actor, date and channel recorded |
| E3-06 | P1 | Document expiry | Restricted file and expiry reminder |

## E4 — Admissions

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E4-01 | P1 | Placement booking | Available slot can be booked without conflict |
| E4-02 | P1 | Appointment reminders | Confirm/reschedule/no-show paths recorded |
| E4-03 | P1 | Placement scoring | Versioned rubric, draft and publish |
| E4-04 | P1 | Group recommendation | Only compatible groups with capacity are shown |
| E4-05 | P1 | Trial | Lead/student can attend one trial with feedback |
| E4-06 | P1 | Offer | Price snapshot, options, validity and status |
| E4-07 | P0 | Lead conversion | Idempotently matches/creates household and student |

## E5 — Academics

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E5-01 | P0 | Program and level | Ordered catalog with CEFR reference |
| E5-02 | P0 | Course version | Published version cannot be silently edited |
| E5-03 | P0 | Units/lessons/outcomes | Group progress has a defined curriculum source |
| E5-04 | P1 | Assessment template | Skill/rubric components reusable and versioned |
| E5-05 | P1 | Report card | Internal review then parent publication |
| E5-06 | P1 | Risk/intervention | High risk has explainable signal, owner and action |

## E6 — Groups, scheduling and enrollment

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E6-01 | P0 | Create group | Level, capacity, teacher, mode and schedule validated |
| E6-02 | P0 | Generate sessions | Recurrence handles holidays and timezone |
| E6-03 | P0 | Detect conflict | Teacher/room conflict blocks or requires override |
| E6-04 | P0 | Calendar | Visible range filters by teacher/group/branch |
| E6-05 | P0 | Draft enrollment | Seat reserved with expiry and price snapshot |
| E6-06 | P0 | Activate enrollment | Capacity and payment rule checked transactionally |
| E6-07 | P1 | Waitlist | Ordered entry and seat offer workflow |
| E6-08 | P1 | Transfer | Academic, schedule and financial effects previewed |
| E6-09 | P1 | Freeze/resume | Versioned policy and dates affect entitlement |
| E6-10 | P1 | Withdrawal | Reason and financial settlement preserved |

## E7 — Sessions and attendance

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E7-01 | P0 | Teacher Today | Assigned sessions and urgent tasks only |
| E7-02 | P0 | Mark attendance | Mobile roster saves one record per learner |
| E7-03 | P0 | Session report | Required parent/internal fields separated |
| E7-04 | P0 | Complete session | One transaction creates downstream effects |
| E7-05 | P0 | Substitute teacher | Access and earning follow actual assignment |
| E7-06 | P1 | Make-up credit | Policy grants one traceable credit |
| E7-07 | P1 | Reschedule/cancel preview | Impact and notifications shown before confirm |
| E7-08 | P1 | Locked correction | Privileged correction requires reason and audit |

## E8 — Billing and finance

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E8-01 | P0 | Product/price | Effective dates and immutable applied snapshot |
| E8-02 | P0 | Issue invoice | Totals validated and unique number assigned |
| E8-03 | P0 | Installments | Due schedule equals invoice balance |
| E8-04 | P0 | Manual payment | Duplicate check, verification and allocation |
| E8-05 | P0 | Household ledger | Every balance amount is explainable |
| E8-06 | P0 | Collection queue | Due/overdue grouped by aging and owner |
| E8-07 | P1 | Discount approval | Threshold and separation rules enforced |
| E8-08 | P1 | Refund/credit | Reversal preserves original transaction |
| E8-09 | P1 | Expenses | Submit, approve and pay with evidence |
| E8-10 | P1 | Payment gateway | Signed replay-safe webhook records once |

## E9 — Teacher payroll

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E9-01 | P0 | Rate rule | Effective-dated rule by teacher/program/role |
| E9-02 | P0 | Session earning | Traceable calculation generated once |
| E9-03 | P1 | Adjustment | Reasoned adjustment without rewriting source |
| E9-04 | P1 | Payroll review | Period groups earnings and exceptions |
| E9-05 | P1 | Approve/pay/lock | Separation, statement and lock enforced |
| E9-06 | P1 | Teacher view | Teacher sees only own pending/approved statement |

## E10 — Portals and communication

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E10-01 | P1 | Family home | Next session, action, progress and balance |
| E10-02 | P1 | Child switcher | Guardian can access only linked children |
| E10-03 | P1 | Teacher mobile workspace | Today, roster, report and earning optimized |
| E10-04 | P1 | Template message | Versioned localized template and delivery state |
| E10-05 | P1 | Essential email | Queue, retry and failure visibility |
| E10-06 | P1 | Family request | Contextual request with SLA/status |
| E10-07 | P2 | WhatsApp outbound | Approved provider templates and status callback |
| E10-08 | P2 | Automation builder | Safe limited trigger/action configuration |

## E11 — Reporting, support and quality

| ID | Priority | Story | Acceptance summary |
|---|---|---|---|
| E11-01 | P0 | Role dashboard | Action queue and metrics link to source list |
| E11-02 | P1 | Funnel report | Definition and attribution are consistent |
| E11-03 | P1 | Occupancy report | Active seats/capacity by group |
| E11-04 | P1 | Collection report | Issued, paid, due and overdue reconcile |
| E11-05 | P1 | Group margin | Revenue/teacher cost trace to transactions |
| E11-06 | P1 | Service requests | Assignment, SLA, resolution and satisfaction |
| E11-07 | P2 | Teacher observation | Versioned rubric and improvement plan |

---

## 5. Golden-path acceptance suite

The release suite includes:

1. Meta/manual lead creation.
2. Duplicate detection.
3. Assignment and first response.
4. Placement booking and completion.
5. Suitable group selection.
6. Offer and price snapshot.
7. Payment and invoice allocation.
8. Lead conversion.
9. Enrollment activation and seat allocation.
10. Teacher access.
11. Attendance and session report.
12. Make-up effect.
13. Teacher earning.
14. Family schedule/billing/progress.
15. Renewal/risk trigger.
16. Management reporting reconciliation.

Each step has an API feature test and critical steps have Playwright coverage.

---

## 6. Definition of Ready

A story enters a sprint when:

- User and business outcome are stated.
- Permission and scope are defined.
- States and error cases are known.
- UX is ready at appropriate fidelity.
- API/data impact is understood.
- Acceptance criteria are testable.
- Dependencies and integrations are available or mocked.
- Analytics/audit needs are stated.

---

## 7. Definition of Done

A story is done when:

- Acceptance criteria pass.
- Laravel policies and feature tests pass.
- API contract is updated.
- Frontend handles loading, empty, error and permission states.
- RTL/mobile behavior is verified.
- Audit and telemetry are present where required.
- Accessibility checks pass for the touched flow.
- No high-severity security issue is open.
- Demo data exists.
- User-facing copy is reviewed.
- Staging demo is accepted.

---

## 8. Change control

During a sprint:

- Critical defects and legal/security corrections may enter.
- New scope replaces equivalent scope; it is not silently added.
- Policy change includes data migration and historical-impact review.
- “Small UI change” is evaluated for API, permission and audit impact.

Post-pilot requests are measured against:

- User frequency.
- Business risk.
- Revenue/retention impact.
- Operational time saved.
- Data quality.
- Implementation and maintenance cost.

