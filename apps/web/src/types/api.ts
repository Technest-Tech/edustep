export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  locale: string;
  timezone: string;
  role: string;
  status: string;
  last_login_at: string | null;
  two_factor_enabled: boolean;
  requires_two_factor_setup: boolean;
  must_change_password: boolean;
  password_changed_at: string | null;
  created_at: string;
};

export type SecuritySession = {
  id: string;
  current: boolean;
  ip_address: string | null;
  device: string;
  last_active_at: string;
};

export type AccountSecurityData = {
  user: User;
  two_factor: {
    enabled: boolean;
    confirmed_at: string | null;
    recovery_codes_remaining: number;
    required: boolean;
  };
  sessions: SecuritySession[];
};

export type AcademySettings = {
  id: string;
  academy_name: string;
  academy_name_en: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  timezone: string;
  locale: string;
  currency: string;
  invoice_prefix: string;
  student_code_prefix: string;
  offer_validity_days: number;
  seat_hold_hours: number;
  working_days: string[];
  business_hours: { start: string; end: string };
  updater: { id: string; name: string } | null;
  updated_at: string;
};

export type RoleDefinition = {
  key: string;
  label: string;
  description: string;
  permissions: string[];
};

export type TeamMember = User & {
  account_type: "staff" | "portal";
  teaching_cohorts_count: number;
  audit_events_count: number;
};

export type AuditLog = {
  id: string;
  action: string;
  category: "settings" | "security" | "finance" | "admissions" | "crm" | "academics" | "operations";
  description: string;
  method: string | null;
  route_name: string | null;
  request_id: string | null;
  ip_address: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[];
  metadata: Record<string, unknown> | null;
  actor: { id: string; name: string; role: string } | null;
  auditable: { type: string; id: string } | null;
  created_at: string;
};

export type ManagementData = {
  summary: {
    active_users: number;
    staff_accounts: number;
    portal_accounts: number;
    suspended_users: number;
    audit_today: number;
  };
  settings: AcademySettings;
  roles: RoleDefinition[];
  team: TeamMember[];
  audit_logs: AuditLog[];
};

export type LabeledValue = {
  value: string;
  label: string;
};

export type Program = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  description?: string | null;
  is_active?: boolean;
  levels?: Level[];
};

export type Level = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  sort_order: number;
  is_active: boolean;
};

export type FollowUp = {
  id: string;
  subject: string;
  notes: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "completed" | "cancelled";
  is_overdue: boolean;
  due_at: string;
  completed_at: string | null;
  assignee?: { id: string; name: string } | null;
  lead?: { id: string; full_name: string; phone: string };
};

export type LeadActivity = {
  id: string;
  type: string;
  channel: string | null;
  direction: string | null;
  title: string;
  details: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  creator?: { id: string; name: string } | null;
};

export type PlacementAssessment = {
  id: string;
  status: string;
  score: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
  assessor?: { id: string; name: string } | null;
  recommended_level?: Pick<Level, "id" | "code" | "name_ar"> | null;
};

export type AdmissionLeadSummary = {
  id: string;
  full_name: string;
  phone: string;
};

export type AdmissionCohortSummary = {
  id: string;
  code: string;
  name: string;
};

export type EnrollmentOffer = {
  id: string;
  offer_number: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired" | "cancelled";
  price_amount: string;
  discount_amount: string;
  net_amount: string;
  valid_until: string;
  is_expired: boolean;
  notes: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  lead?: AdmissionLeadSummary;
  cohort?: AdmissionCohortSummary;
  creator?: { id: string; name: string } | null;
  seat_reservation?: {
    id: string;
    status: "held" | "converted" | "released" | "expired";
    reserved_until: string | null;
  } | null;
  created_at: string;
};

export type TrialBooking = {
  id: string;
  status: "scheduled" | "confirmed" | "attended" | "no_show" | "cancelled";
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  room_name: string | null;
  notes: string | null;
  confirmed_at: string | null;
  attended_at: string | null;
  lead?: AdmissionLeadSummary;
  cohort?: AdmissionCohortSummary;
  creator?: { id: string; name: string } | null;
  created_at: string;
};

export type SeatReservation = {
  id: string;
  status: "held" | "converted" | "released" | "expired";
  reserved_until: string;
  converted_at: string | null;
  released_at: string | null;
  lead?: AdmissionLeadSummary;
  cohort?: AdmissionCohortSummary;
  offer_id: string | null;
  reserver?: { id: string; name: string } | null;
  created_at: string;
};

export type WaitlistEntry = {
  id: string;
  status: "waiting" | "offered" | "converted" | "withdrawn" | "expired";
  priority: number;
  joined_at: string;
  offered_until: string | null;
  notes: string | null;
  lead?: AdmissionLeadSummary;
  cohort?: AdmissionCohortSummary;
  creator?: { id: string; name: string } | null;
  created_at: string;
};

export type AdmissionsData = {
  summary: {
    open_offers: number;
    offers_value: string;
    upcoming_trials: number;
    active_holds: number;
    waiting: number;
    accepted_this_month: number;
  };
  offers: EnrollmentOffer[];
  trials: TrialBooking[];
  reservations: SeatReservation[];
  waitlist: WaitlistEntry[];
};

export type Lead = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_phone: string | null;
  email: string | null;
  source: LabeledValue;
  status: LabeledValue;
  learner_age: number | null;
  preferred_schedule: string | null;
  preferred_contact_channel?: string;
  current_level?: string | null;
  notes?: string | null;
  lost_reason?: string | null;
  converted_at?: string | null;
  program: Pick<Program, "id" | "name_ar" | "code"> | null;
  owner: { id: string; name: string } | null;
  next_follow_up: FollowUp | null;
  follow_ups?: FollowUp[];
  activities?: LeadActivity[];
  placement_assessment?: PlacementAssessment | null;
  enrollment_offers?: EnrollmentOffer[];
  trial_bookings?: TrialBooking[];
  seat_reservations?: SeatReservation[];
  waitlist_entries?: WaitlistEntry[];
  student?: Student | null;
  last_contacted_at: string | null;
  created_at: string;
};

export type LeadPipelineColumn = {
  status: LabeledValue;
  count: number;
  has_more: boolean;
  leads: Lead[];
};

export type LeadPipeline = {
  columns: LeadPipelineColumn[];
  total: number;
  limit_per_stage: number;
};

export type Cohort = {
  id: string;
  code: string;
  name: string;
  status: string;
  delivery_mode: string;
  capacity: number;
  enrolled_count: number;
  reserved_seats: number;
  waitlist_count: number;
  available_seats: number;
  fee: string;
  starts_on: string | null;
  ends_on: string | null;
  schedule: { day: string; time: string }[] | null;
  timezone: string;
  meeting_url: string | null;
  room_name: string | null;
  program: Pick<Program, "id" | "code" | "name_ar">;
  level: Pick<Level, "id" | "code" | "name_ar">;
  teacher: { id: string; name: string } | null;
};

export type Enrollment = {
  id: string;
  status: string;
  enrolled_on: string;
  fee_amount: string;
  discount_amount: string;
  net_amount: string;
  cohort: {
    id: string;
    code: string;
    name: string;
    level: Pick<Level, "id" | "code" | "name_ar"> | null;
  } | null;
};

export type Student = {
  id: string;
  student_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  status: string;
  joined_on: string;
  notes: string | null;
  enrollments?: Enrollment[];
  attendance_summary?: {
    records: number;
    absences: number;
    rate: number;
  };
  progress_entries?: ProgressEntry[];
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  status: "present" | "absent" | "late" | "excused";
  checked_in_at: string | null;
  notes: string | null;
  student: {
    id: string;
    student_code: string;
    full_name: string;
  };
};

export type ClassSession = {
  id: string;
  title: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  room_name: string | null;
  lesson_focus: string | null;
  teacher_notes: string | null;
  completed_at: string | null;
  teacher: { id: string; name: string } | null;
  cohort?: {
    id: string;
    code: string;
    name: string;
    delivery_mode: string;
    program: string | null;
    level: string | null;
  } | null;
  teacher_earning?: {
    id: string;
    status: "pending" | "approved" | "paid" | "void";
    amount: string;
  } | null;
  attendance_summary: {
    recorded: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
  };
  attendance_records: AttendanceRecord[];
};

export type CalendarData = {
  range: { from: string; to: string };
  summary: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    teaching_minutes: number;
  };
  sessions: ClassSession[];
};

export type ProgressEntry = {
  id: string;
  type: string;
  title: string;
  score: string | null;
  rating: "needs_improvement" | "developing" | "good" | "excellent";
  feedback: string | null;
  occurred_on: string;
  level: Pick<Level, "id" | "code" | "name_ar"> | null;
  evaluator: { id: string; name: string } | null;
};

export type CohortStudent = {
  id: string;
  student_code: string;
  full_name: string;
  phone: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  enrollment_id: string;
  attendance_rate: number;
  absences: number;
  latest_progress: ProgressEntry[];
};

export type CohortDetail = Cohort & {
  metrics: {
    sessions_total: number;
    sessions_completed: number;
    sessions_upcoming: number;
    attendance_rate: number;
    collected_enrollment_value: string;
  };
  sessions: ClassSession[];
  students: CohortStudent[];
  waitlist: WaitlistEntry[];
};

export type Teacher = {
  id: string;
  name: string;
  email: string;
  status: string;
  phone: string | null;
  employment_type: string | null;
  specialization: string | null;
  hourly_rate: string | null;
  current_rate: {
    type: "fixed_session" | "hourly";
    amount: string;
    effective_from: string;
  } | null;
  availability: string[] | null;
  bio: string | null;
  active_cohorts_count: number;
  active_students_count: number;
  cohorts: {
    id: string;
    code: string;
    name: string;
    status: string;
    program: string | null;
    level: string | null;
    students_count: number;
  }[];
  operational_metrics?: {
    completed_sessions: number;
    upcoming_sessions: number;
    report_completion_rate: number;
    month_earnings: string;
  };
  sessions?: {
    id: string;
    title: string;
    status: string;
    starts_at: string;
    ends_at: string;
    has_report: boolean;
    cohort: { id: string; code: string; name: string };
  }[];
  earnings?: {
    id: string;
    status: string;
    amount: string;
    earned_on: string;
    session: { id: string; title: string; cohort: string };
  }[];
};

export type Expense = {
  id: string;
  expense_number: string;
  category: string;
  vendor_name: string | null;
  description: string;
  amount: string;
  status: "draft" | "submitted" | "approved" | "paid" | "rejected";
  incurred_on: string;
  due_on: string | null;
  payment_method: string | null;
  paid_at: string | null;
  notes: string | null;
  creator: { id: string; name: string } | null;
  approver: { id: string; name: string } | null;
  approved_at: string | null;
  created_at: string;
};

export type TeacherEarning = {
  id: string;
  status: "pending" | "approved" | "paid" | "void";
  duration_minutes: number;
  rate_type: "fixed_session" | "hourly";
  rate_amount: string;
  amount: string;
  earned_on: string;
  approved_at: string | null;
  paid_at: string | null;
  teacher: { id: string; name: string };
  session: {
    id: string;
    title: string;
    starts_at: string;
    cohort: { id: string; name: string; code: string } | null;
  };
};

export type PayrollData = {
  range: { from: string; to: string };
  summary: {
    sessions: number;
    pending: string;
    approved: string;
    paid: string;
    total: string;
    missing_rates: number;
  };
  teachers: {
    teacher: { id: string; name: string };
    sessions: number;
    pending: string;
    approved: string;
    paid: string;
    total: string;
  }[];
  earnings: TeacherEarning[];
};

export type Payment = {
  id: string;
  payment_number: string;
  amount: string;
  method: string;
  paid_at: string;
  reference: string | null;
  notes: string | null;
  recorder?: { id: string; name: string } | null;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  status: string;
  issued_on: string;
  due_on: string;
  subtotal: string;
  discount_amount: string;
  total_amount: string;
  paid_amount: string;
  balance: string;
  is_overdue: boolean;
  notes: string | null;
  student: {
    id: string;
    student_code: string;
    full_name: string;
    phone: string;
  };
  enrollment: {
    id: string;
    cohort: { id: string; name: string; code: string } | null;
  } | null;
  payments: Payment[];
  created_at: string;
};

export type FinanceSummary = {
  billed: string;
  collected: string;
  outstanding: string;
  overdue: string;
  collection_rate: number;
  payments_this_month: string;
};

export type DashboardData = {
  metrics: {
    open_leads: number;
    new_leads: number;
    active_students: number;
    active_cohorts: number;
    pending_follow_ups: number;
    overdue_follow_ups: number;
    conversion_rate: number;
  };
  funnel: { status: string; label: string; count: number }[];
  recent_leads: Lead[];
  today_follow_ups: FollowUp[];
  cohorts: Cohort[];
  generated_at: string;
};

export type NotificationItem = {
  id: string;
  type:
    | "follow_up"
    | "invoice"
    | "session"
    | "expense"
    | "payroll"
    | "academic_risk"
    | "service_request";
  title: string;
  description: string;
  severity: "urgent" | "warning" | "info";
  href: string;
  occurred_at: string;
};

export type NotificationCenterData = {
  unread_count: number;
  items: NotificationItem[];
  generated_at: string;
};

export type OperationsReport = {
  summary: {
    active_students: number;
    active_cohorts: number;
    sessions_completion_rate: number;
    attendance_rate: number;
    conversion_rate: number;
    collection_rate: number;
  };
  finance: {
    billed: string;
    collected: string;
    outstanding: string;
    overdue: string;
    operating_expenses: string;
    teacher_cost: string;
    net_operating_cash: string;
    monthly_revenue: { month: string; label: string; amount: string }[];
  };
  attendance: {
    present: number;
    late: number;
    absent: number;
    excused: number;
  };
  lead_sources: { source: string; label: string; count: number }[];
  cohorts: {
    id: string;
    name: string;
    code: string;
    program: string;
    level: string;
    teacher: string | null;
    status: string;
    capacity: number;
    active_students: number;
    occupancy_rate: number;
    sessions: number;
    completed_sessions: number;
    attendance_rate: number;
  }[];
  teachers: {
    id: string;
    name: string;
    active_cohorts: number;
    active_students: number;
    completed_sessions: number;
  }[];
  generated_at: string;
};

export type TeacherTodayData = {
  teacher: { id: string; name: string };
  date: string;
  summary: {
    today_sessions: number;
    active_cohorts: number;
    active_students: number;
    missing_reports: number;
    month_earnings: string;
  };
  today_sessions: ClassSession[];
  upcoming_sessions: ClassSession[];
  missing_reports: ClassSession[];
  cohorts: {
    id: string;
    code: string;
    name: string;
    status: string;
    students_count: number;
  }[];
};

export type TeacherEarningsData = {
  range: { from: string; to: string };
  summary: {
    sessions: number;
    pending: string;
    approved: string;
    paid: string;
    total: string;
  };
  earnings: TeacherEarning[];
};

export type FamilyChild = {
  id: string;
  student_code: string;
  full_name: string;
  status: string;
  cohort: {
    id: string;
    code: string;
    name: string;
    delivery_mode: string;
    level: string | null;
    program: string | null;
    teacher: string | null;
  } | null;
  attendance: {
    records: number;
    absences: number;
    rate: number;
  };
  next_session: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    meeting_url: string | null;
    room_name: string | null;
  } | null;
  latest_progress: {
    id: string;
    type: string;
    title: string;
    score: string | null;
    rating: string;
    feedback: string | null;
    occurred_on: string;
    level: string | null;
    evaluator: string | null;
  }[];
  published_reports: StudentProgressReport[];
  invoices: {
    id: string;
    invoice_number: string;
    status: string;
    issued_on: string;
    due_on: string | null;
    total_amount: string;
    paid_amount: string;
    balance: string;
  }[];
};

export type Message = {
  id: string;
  channel: "internal" | "whatsapp" | "email" | "sms";
  direction: string;
  subject: string | null;
  body: string;
  status: "draft" | "queued" | "sent" | "delivered" | "read" | "failed";
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failure_reason: string | null;
  provider_connected: boolean;
  sender: { id: string; name: string } | null;
  guardian: { id: string; name: string | null; phone: string } | null;
  student: { id: string; student_code: string; full_name: string } | null;
  template: { id: string; name: string } | null;
  created_at: string;
};

export type MessageTemplate = {
  id: string;
  key: string;
  name: string;
  channel: Message["channel"];
  subject: string | null;
  body: string;
};

export type Guardian = {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferred_channel: string;
  relationship_label: string | null;
  students: {
    id: string;
    student_code: string;
    full_name: string;
    relationship: string;
    is_primary: boolean;
  }[];
};

export type FamilyHomeData = {
  guardian: {
    id: string;
    name: string;
    phone: string;
    preferred_channel: string;
    relationship_label: string | null;
  };
  summary: {
    children: number;
    outstanding_balance: string;
    unread_messages: number;
    open_requests: number;
  };
  children: FamilyChild[];
  messages: Message[];
  service_requests: FamilyServiceRequest[];
};

export type StudentProgressReport = {
  id: string;
  period_label: string;
  period_starts_on: string;
  period_ends_on: string;
  status: "draft" | "published" | "archived";
  overall_score: string | null;
  overall_rating: "needs_improvement" | "developing" | "good" | "excellent";
  attendance_rate: string | null;
  summary: string;
  strengths: string | null;
  areas_for_improvement: string | null;
  next_steps: string | null;
  published_at: string | null;
  level: Pick<Level, "id" | "code" | "name_ar"> | null;
  creator: { id: string; name: string } | null;
  publisher: { id: string; name: string } | null;
  created_at: string;
};

export type AcademicIntervention = {
  id: string;
  academic_risk_id: string | null;
  type: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  title: string;
  plan: string;
  due_on: string | null;
  outcome: string | null;
  completed_at: string | null;
  owner: { id: string; name: string } | null;
  creator: { id: string; name: string } | null;
  created_at: string;
};

export type AcademicRisk = {
  id: string;
  type: "attendance" | "performance" | "engagement" | "homework" | "behavior" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "monitoring" | "resolved";
  title: string;
  description: string | null;
  is_automatic: boolean;
  detected_at: string;
  resolved_at: string | null;
  metadata: Record<string, number | string> | null;
  assignee: { id: string; name: string } | null;
  interventions: AcademicIntervention[];
  created_at: string;
};

export type AcademicProgressStudent = {
  id: string;
  student_code: string;
  full_name: string;
  status: string;
  cohort: {
    id: string;
    code: string;
    name: string;
    level: string | null;
    teacher: string | null;
    enrollment_id: string;
    level_id: string;
  } | null;
  attendance_rate: number;
  average_score: number | null;
  assessments_count: number;
  open_risks: AcademicRisk[];
  reports: StudentProgressReport[];
};

export type AcademicProgressData = {
  summary: {
    students: number;
    at_risk: number;
    open_interventions: number;
    draft_reports: number;
    published_this_month: number;
  };
  students: AcademicProgressStudent[];
};

export type FamilyServiceRequest = {
  id: string;
  request_number: string;
  category: "academic" | "schedule" | "billing" | "technical" | "complaint" | "other";
  priority: "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  subject: string;
  description: string;
  resolution: string | null;
  resolved_at: string | null;
  guardian?: { id: string; name: string | null; phone: string };
  student: Pick<Student, "id" | "student_code" | "full_name"> | null;
  assignee: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
};

export type ServiceRequestsData = {
  summary: {
    total: number;
    open: number;
    in_progress: number;
    urgent: number;
  };
  requests: FamilyServiceRequest[];
};

export type StudyPackage = {
  id: string;
  code: string;
  name: string;
  sessions_count: number;
  duration_weeks: number;
  price: string;
  default_installments: number;
  is_active: boolean;
  description: string | null;
  program: Pick<Program, "id" | "code" | "name_ar">;
  level: Pick<Level, "id" | "code" | "name_ar"> | null;
  subscriptions_count: number;
};

export type SubscriptionInstallment = {
  id: string;
  installment_number: number;
  amount: string;
  due_on: string;
  status: "pending" | "invoiced" | "partially_paid" | "paid" | "waived" | "overdue";
  paid_at: string | null;
  invoice: {
    id: string;
    invoice_number: string;
    status: string;
    paid_amount: string;
    balance: string;
  } | null;
};

export type StudentSubscription = {
  id: string;
  status:
    | "scheduled"
    | "active"
    | "frozen"
    | "expiring"
    | "renewed"
    | "completed"
    | "cancelled";
  starts_on: string;
  ends_on: string;
  renewal_due_on: string;
  days_remaining: number;
  included_sessions: number;
  price_amount: string;
  discount_amount: string;
  net_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  frozen_at: string | null;
  frozen_until: string | null;
  cancelled_at: string | null;
  notes: string | null;
  student: Pick<Student, "id" | "student_code" | "full_name" | "phone">;
  enrollment: {
    id: string;
    cohort: { id: string; code: string; name: string } | null;
  } | null;
  package: Pick<
    StudyPackage,
    "id" | "code" | "name" | "sessions_count" | "duration_weeks"
  >;
  parent_subscription_id: string | null;
  installments: SubscriptionInstallment[];
  creator: { id: string; name: string } | null;
  created_at: string;
};

export type SubscriptionsData = {
  summary: {
    total: number;
    active: number;
    frozen: number;
    renewal_due: number;
    outstanding: string;
  };
  packages: StudyPackage[];
  subscriptions: StudentSubscription[];
};

export type ScheduleGenerationResult = {
  summary: {
    created: number;
    skipped_duplicates: number;
    skipped_closures: number;
    conflicts: number;
  };
  closures: { date: string; name: string }[];
  conflicts: { starts_at: string; message: string }[];
  sessions: ClassSession[];
};

export type ApiItem<T> = {
  data: T;
};

export type ApiCollection<T> = {
  data: T[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
};
