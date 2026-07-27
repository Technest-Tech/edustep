# 04 — API and Integrations Blueprint

## 1. API goals

- Stable contract between Laravel and Next.js.
- Consistent authorization and errors.
- Safe retries for payments and integrations.
- Efficient list filtering for operational screens.
- Clear versioning.
- No frontend dependence on database column names.
- Traceable external events.

Base path:

```text
/api/v1
```

---

## 2. Resource conventions

### HTTP methods

| Method | Use |
|---|---|
| `GET` | Read resources and lists |
| `POST` | Create resource or run a named business action |
| `PATCH` | Partial editable-field update |
| `DELETE` | Archive only where deletion is valid |

Important state transitions use named actions rather than arbitrary status edits:

```text
POST /api/v1/leads/{lead}/convert
POST /api/v1/enrollments/{enrollment}/activate
POST /api/v1/sessions/{session}/complete
POST /api/v1/invoices/{invoice}/issue
POST /api/v1/payroll-periods/{period}/lock
```

This makes permissions, validation, audit and side effects explicit.

### JSON naming

- `snake_case` API fields match Laravel conventions.
- TypeScript generation handles types without renaming.
- Dates use `YYYY-MM-DD`.
- Timestamps use ISO 8601 UTC.
- Money is represented as:

```json
{
  "amount_minor": 125050,
  "currency": "EGP",
  "formatted": "1,250.50 ج.م"
}
```

The formatted value is display help, not a calculation source.

---

## 3. Response shapes

### Single resource

```json
{
  "data": {
    "id": "01K...",
    "type": "lead",
    "name": "Example"
  },
  "meta": {
    "request_id": "01K..."
  }
}
```

### List

```json
{
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 25,
    "total": 240,
    "last_page": 10,
    "request_id": "01K..."
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

### Validation error

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "راجع البيانات المطلوبة.",
    "fields": {
      "phone": ["رقم الهاتف غير صالح."]
    },
    "request_id": "01K..."
  }
}
```

### Business rule error

```json
{
  "error": {
    "code": "GROUP_CAPACITY_EXCEEDED",
    "message": "لا يوجد مقعد متاح في الجروب.",
    "details": {
      "group_id": "01K...",
      "available_seats": 0
    },
    "request_id": "01K..."
  }
}
```

### Error code classes

- `AUTHENTICATION_REQUIRED`
- `AUTHORIZATION_DENIED`
- `VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`
- `STATE_CONFLICT`
- `VERSION_CONFLICT`
- `RATE_LIMITED`
- `INTEGRATION_UNAVAILABLE`
- Domain-specific codes such as `INVOICE_ALREADY_PAID`

Messages are localized, while stable codes power frontend behavior.

---

## 4. Filtering, sorting and inclusion

Example:

```text
GET /api/v1/leads
  ?search=010...
  &stage_id=...
  &owner_id=...
  &source_id=...
  &next_action_from=2026-07-26
  &next_action_to=2026-07-30
  &sort=-next_action_at
  &page=1
  &per_page=25
```

Rules:

- Every filter is allowlisted.
- Sort fields are allowlisted.
- `per_page` has a safe maximum.
- Related data is included only through allowlisted `include` values.
- Expensive includes are not enabled on broad lists.
- Search behavior and normalized phone matching are documented per resource.

Timelines may use cursor pagination to avoid unstable results.

---

## 5. Optimistic concurrency

Editable high-conflict resources expose `version`.

Request:

```json
{
  "version": 7,
  "owner_user_id": "01K..."
}
```

If the stored version is now 8, API returns:

```text
409 VERSION_CONFLICT
```

The frontend then:

- Shows that another user changed the record.
- Refetches the current data.
- Preserves safe unsaved text where possible.
- Never silently overwrites.

---

## 6. Idempotency

`Idempotency-Key` is required for:

- Lead conversion.
- Enrollment activation.
- Invoice issue.
- Manual payment record.
- Gateway payment processing.
- Refund.
- Payroll approval/lock.
- Import start.
- Webhook processing.

The server stores:

- Key.
- Authenticated actor or integration.
- Endpoint/action.
- Request hash.
- Response status/body reference.
- Expiry.

Reusing a key with different request content returns a conflict.

---

## 7. Authentication endpoints

Laravel Sanctum endpoints plus application endpoints:

```text
GET    /sanctum/csrf-cookie
POST   /login
POST   /logout
POST   /forgot-password
POST   /reset-password
POST   /email/verification-notification

GET    /api/v1/me
PATCH  /api/v1/me/preferences
GET    /api/v1/me/sessions
DELETE /api/v1/me/sessions/{session}
POST   /api/v1/me/two-factor/enable
POST   /api/v1/me/two-factor/confirm
DELETE /api/v1/me/two-factor
```

`GET /me` returns:

- User profile.
- Roles.
- Effective permission keys.
- Branch scope.
- Locale/timezone.
- Navigation capability summary.

It does not replace backend authorization.

---

## 8. Core endpoint map

## 8.1 CRM

```text
GET    /leads
POST   /leads
GET    /leads/{lead}
PATCH  /leads/{lead}
POST   /leads/{lead}/assign
POST   /leads/{lead}/transition
POST   /leads/{lead}/convert
POST   /leads/{lead}/merge

GET    /leads/{lead}/activities
POST   /leads/{lead}/activities
GET    /crm-tasks
POST   /crm-tasks
PATCH  /crm-tasks/{task}
POST   /crm-tasks/{task}/complete

GET    /lead-stages
GET    /lead-sources
GET    /marketing-campaigns
```

## 8.2 People

```text
GET    /households
POST   /households
GET    /households/{household}
PATCH  /households/{household}
POST   /households/{household}/guardians
POST   /households/{household}/students

GET    /students
POST   /students
GET    /students/{student}
PATCH  /students/{student}
GET    /students/{student}/timeline

GET    /teachers
POST   /teachers
GET    /teachers/{teacher}
PATCH  /teachers/{teacher}
POST   /teachers/{teacher}/transition
GET    /teachers/{teacher}/availability
PUT    /teachers/{teacher}/availability
```

## 8.3 Admissions

```text
GET    /placement-appointments
POST   /placement-appointments
GET    /placement-appointments/{appointment}
PATCH  /placement-appointments/{appointment}
POST   /placement-appointments/{appointment}/confirm
POST   /placement-appointments/{appointment}/reschedule
POST   /placement-appointments/{appointment}/no-show
POST   /placement-appointments/{appointment}/complete

GET    /trials
POST   /trials
POST   /trials/{trial}/record-attendance

GET    /offers
POST   /offers
GET    /offers/{offer}
PATCH  /offers/{offer}
POST   /offers/{offer}/send
POST   /offers/{offer}/accept
POST   /offers/{offer}/decline
```

## 8.4 Academic catalog

```text
GET    /programs
POST   /programs
GET    /levels
POST   /levels
GET    /course-versions
POST   /course-versions
GET    /course-versions/{course}
PATCH  /course-versions/{course}
POST   /course-versions/{course}/publish

GET    /skills
GET    /rubrics
GET    /assessment-templates
POST   /assessment-templates
```

## 8.5 Groups, calendar and sessions

```text
GET    /groups
POST   /groups
GET    /groups/{group}
PATCH  /groups/{group}
POST   /groups/{group}/open-sales
POST   /groups/{group}/activate
POST   /groups/{group}/complete
GET    /groups/{group}/capacity
GET    /groups/{group}/roster

GET    /calendar
POST   /groups/{group}/generate-sessions
GET    /sessions
GET    /sessions/{session}
PATCH  /sessions/{session}
POST   /sessions/{session}/reschedule
POST   /sessions/{session}/cancel
POST   /sessions/{session}/assign-substitute
POST   /sessions/{session}/complete
POST   /sessions/{session}/reopen

GET    /sessions/{session}/attendance
PUT    /sessions/{session}/attendance
PUT    /sessions/{session}/report
```

## 8.6 Enrollment

```text
GET    /enrollments
POST   /enrollments
GET    /enrollments/{enrollment}
POST   /enrollments/{enrollment}/activate
POST   /enrollments/{enrollment}/pause
POST   /enrollments/{enrollment}/resume
POST   /enrollments/{enrollment}/transfer
POST   /enrollments/{enrollment}/withdraw
POST   /enrollments/{enrollment}/complete

GET    /makeup-credits
POST   /makeup-credits/{credit}/reserve
POST   /makeup-credits/{credit}/release
POST   /makeup-credits/{credit}/use

GET    /waitlists
POST   /groups/{group}/waitlist
POST   /waitlists/{entry}/offer-seat
```

## 8.7 Progress

```text
GET    /assessments
POST   /assessments
GET    /assessments/{assessment}
PATCH  /assessments/{assessment}
POST   /assessments/{assessment}/publish

GET    /students/{student}/progress
GET    /groups/{group}/progress
GET    /progress-risks
POST   /students/{student}/interventions
PATCH  /interventions/{intervention}

GET    /report-cards
POST   /report-cards
POST   /report-cards/{report}/publish
```

## 8.8 Billing

```text
GET    /products
GET    /price-lists

GET    /invoices
POST   /invoices
GET    /invoices/{invoice}
PATCH  /invoices/{invoice}
POST   /invoices/{invoice}/issue
POST   /invoices/{invoice}/void
GET    /invoices/{invoice}/pdf

GET    /payments
POST   /payments
GET    /payments/{payment}
POST   /payments/{payment}/verify
POST   /payments/{payment}/allocate
POST   /payments/{payment}/refund

GET    /collections
GET    /households/{household}/ledger
GET    /expenses
POST   /expenses
POST   /expenses/{expense}/submit
POST   /expenses/{expense}/approve
POST   /expenses/{expense}/record-payment
```

## 8.9 Payroll

```text
GET    /teacher-rates
POST   /teacher-rates
GET    /teacher-earnings
GET    /payroll-periods
POST   /payroll-periods
GET    /payroll-periods/{period}
POST   /payroll-periods/{period}/review
POST   /payroll-periods/{period}/approve
POST   /payroll-periods/{period}/record-payouts
POST   /payroll-periods/{period}/lock
```

## 8.10 Communication and support

```text
GET    /messages
POST   /messages
GET    /message-templates
POST   /message-templates

GET    /automation-rules
POST   /automation-rules
POST   /automation-rules/{rule}/activate
POST   /automation-rules/{rule}/pause
GET    /automation-runs

GET    /service-requests
POST   /service-requests
GET    /service-requests/{request}
POST   /service-requests/{request}/messages
POST   /service-requests/{request}/assign
POST   /service-requests/{request}/resolve
```

---

## 9. Purpose-built action previews

High-impact actions support a preview endpoint or dry-run option:

```text
POST /enrollments/{id}/transfer/preview
POST /sessions/{id}/reschedule/preview
POST /invoices/{id}/void/preview
POST /payments/{id}/refund/preview
POST /payroll-periods/{id}/lock/preview
```

Preview returns:

- Validation findings.
- Financial effects.
- Capacity effects.
- Records that will change.
- Messages that will be queued.
- Required approval.

The final command includes a short-lived preview token or equivalent version
checks so the user does not confirm stale effects.

---

## 10. OpenAPI contract

The contract describes:

- Request schemas.
- Response schemas.
- Stable error codes.
- Pagination.
- Security.
- Permission requirements.
- Idempotency requirements.
- Examples in Arabic and English.

CI checks:

- Schema validity.
- Generated TypeScript types are current.
- Breaking contract diff.
- Example responses match Laravel resource tests.

---

## 11. Meta lead integration

### Inbound flow

1. Meta sends webhook.
2. Endpoint verifies signature/challenge.
3. Raw receipt is stored with provider event id.
4. Duplicate event returns success without duplicate lead.
5. Worker fetches/normalizes allowed lead fields.
6. Lead deduplication runs.
7. Source/campaign/ad attribution is stored.
8. Assignment and SLA start.
9. Welcome action is queued if consent and template rules allow.

Failure handling:

- Retry transient provider errors.
- Route unmapped forms to an integration review queue.
- Alert on sustained failure.
- Preserve raw event metadata with retention controls.

---

## 12. WhatsApp integration

### Supported v1 use

- Approved template notifications.
- Appointment confirmations and reminders.
- Welcome message after enrollment.
- Session change/cancellation.
- Payment due and receipt.
- Progress report available.
- Delivery status updates.

### Data model

- Internal message id.
- Template version.
- Recipient and consent.
- Provider message id.
- Queued/sent/delivered/read/failed.
- Attempt and error code.

### Boundary

WhatsApp delivery does not automatically mark a CRM task complete. A business
outcome such as “placement booked” must be represented explicitly in EduStep.

Two-way inbox and agent assignment can be a later phase after outbound
notifications are reliable.

---

## 13. Payment gateway integration

### Flow

1. Laravel creates local payment intent/reference.
2. Provider payment link/session is created.
3. Family is redirected or receives link.
4. Provider webhook is verified and stored.
5. Worker reconciles provider status.
6. Payment and allocation are created transactionally.
7. Enrollment activation/receipt events are emitted.
8. Family UI polls or receives refreshed state.

Rules:

- Browser redirect is not proof of payment.
- Verified server webhook is authoritative.
- Provider event and transaction references are unique.
- Repeated webhook is safe.
- Amount/currency/order are verified.
- Suspicious mismatch goes to finance review.

Paymob is the first Egypt-focused candidate, but final contract and technical
review happen before adapter implementation.

---

## 14. Calendar and live-class integration

v1:

- Store Zoom/Google Meet or other meeting link per group/session.
- Generate iCalendar feeds for teachers.
- Optional Google Calendar sync after core scheduling is stable.

Rules:

- EduStep is the scheduling source of truth.
- External calendar deletion does not silently cancel an EduStep session.
- Sync conflicts and token expiry are visible.
- Meeting links are visible only to authorized session participants.

---

## 15. Email and document delivery

- Transactional email provider adapter.
- Queue all email.
- Track accepted/delivered/bounced where provider supports it.
- Invoice and progress PDFs generated asynchronously.
- Links use authorized application routes or short-lived signed files.
- Do not attach sensitive child data unless policy explicitly allows it.

---

## 16. Integration adapter interface

Each provider adapter exposes domain-oriented operations:

```text
MessagingProvider
├── sendTemplate()
├── sendTextIfAllowed()
└── getDeliveryStatus()

PaymentProvider
├── createPaymentLink()
├── verifyWebhook()
├── parseEvent()
└── refund()

CalendarProvider
├── createOrUpdateEvent()
├── cancelEvent()
└── refreshAuthorization()
```

Business modules depend on these interfaces, not provider SDKs directly.

---

## 17. Rate limiting

Separate limits for:

- Login.
- Password reset.
- Public booking.
- Public offer lookup.
- File uploads.
- Search.
- Export.
- Integration API tokens.
- Webhooks by signature/provider.

Limits use user id, IP, token or provider as appropriate. A retry-after response
is returned for legitimate clients.

---

## 18. API acceptance gate

- Same-origin browser contract accepted.
- REST and action endpoint style accepted.
- Error shape and codes accepted.
- Money and date representation accepted.
- Pagination/filter conventions accepted.
- Idempotency scope accepted.
- OpenAPI ownership accepted.
- Meta/WhatsApp/payment integration order accepted.
- Provider credentials and sandbox ownership identified before integration sprint.

