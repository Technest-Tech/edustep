"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { homeForRole } from "@/lib/auth-routing";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  BookMarked,
  BookOpenText,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  GraduationCap,
  HandCoins,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  MessageCircleMore,
  MessageSquareText,
  ReceiptText,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tickets,
  UserPlus,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DocItem = {
  id: string;
  title: string;
  summary: string;
  keywords: string;
};

type DocGroup = {
  label: string;
  items: DocItem[];
};

const docGroups: DocGroup[] = [
  {
    label: "ابدأ من هنا",
    items: [
      {
        id: "introduction",
        title: "فكرة النظام",
        summary: "كيف ترتبط أقسام الأكاديمية ببعضها.",
        keywords: "مقدمة رحلة العميل التشغيل النظام الأكاديمية",
      },
      {
        id: "quick-start",
        title: "أول يوم تشغيل",
        summary: "الترتيب الصحيح قبل إدخال البيانات الحقيقية.",
        keywords: "بداية إعداد تنظيف بيانات فريق حسابات",
      },
      {
        id: "customer-journey",
        title: "رحلة العميل الكاملة",
        summary: "من أول رسالة حتى طالب منتظم.",
        keywords: "عميل متابعة اختبار تجربة عرض مقعد طالب فاتورة",
      },
    ],
  },
  {
    label: "النمو والقبول",
    items: [
      {
        id: "dashboard",
        title: "نظرة عامة",
        summary: "لوحة قرار المدير اليومية.",
        keywords: "dashboard مؤشرات عملاء طلاب جروبات متابعة تحويل",
      },
      {
        id: "leads",
        title: "العملاء والمتابعات CRM",
        summary: "إدارة كل فرصة ومتابعة.",
        keywords: "CRM pipeline مسار قائمة drag drop عميل متابعة نشاط",
      },
      {
        id: "admissions",
        title: "القبول والتجارب",
        summary: "الاختبارات والتجارب والعروض والحجوزات.",
        keywords: "قبول اختبار مستوى تجربة عرض سعر حجز مقعد انتظار",
      },
    ],
  },
  {
    label: "التشغيل الأكاديمي",
    items: [
      {
        id: "groups",
        title: "الجروبات والحصص",
        summary: "إنشاء الجروب وتشغيل الدراسة والحضور.",
        keywords: "جروب حصة جدول حضور غياب سعة انتظار تقييم",
      },
      {
        id: "calendar",
        title: "تقويم الأكاديمية",
        summary: "عرض أسبوعي لكل الحصص والتعارضات.",
        keywords: "تقويم أسبوع معلم جروب مجدولة مكتملة ملغاة تعارض",
      },
      {
        id: "students",
        title: "الطلاب",
        summary: "الملف الموحد للطالب.",
        keywords: "طالب ولي أمر تسجيل جروب مستوى فاتورة تقدم",
      },
      {
        id: "teachers",
        title: "المعلمون",
        summary: "الملفات والإسناد والتوفر والمستحقات.",
        keywords: "معلم مدرس جروبات توفر راتب مستحق ساعة حصة",
      },
      {
        id: "levels",
        title: "المستويات والمناهج",
        summary: "مسارات التعلم وربط المستويات بالجروبات.",
        keywords: "برنامج مستوى منهج مسار CEFR",
      },
      {
        id: "progress",
        title: "التقدم الأكاديمي",
        summary: "المخاطر وخطط التدخل والتقارير.",
        keywords: "تقدم تقرير مسودة نشر خطر تدخل دعم تقييم حضور",
      },
    ],
  },
  {
    label: "الأسرة والتواصل",
    items: [
      {
        id: "communications",
        title: "مركز التواصل",
        summary: "سجل الرسائل والقوالب والقنوات.",
        keywords: "رسالة واتساب بريد SMS قالب ولي أمر",
      },
      {
        id: "service-requests",
        title: "طلبات أولياء الأمور",
        summary: "استلام الطلبات وتوثيق الحل.",
        keywords: "طلب شكوى مساعدة دعم أولوية حل",
      },
      {
        id: "family-portal",
        title: "بوابة ولي الأمر",
        summary: "ما يراه ولي الأمر عن أبنائه.",
        keywords: "أسرة ولي أمر أبناء حضور تقدم فاتورة رسائل",
      },
    ],
  },
  {
    label: "الاشتراكات والمالية",
    items: [
      {
        id: "subscriptions",
        title: "الاشتراكات والتجديد",
        summary: "الباقات والأقساط والتجميد والتجديد.",
        keywords: "اشتراك باقة قسط تجديد تجميد فاتورة",
      },
      {
        id: "finance",
        title: "الحسابات والتحصيل",
        summary: "الفواتير والمدفوعات والمتأخرات.",
        keywords: "حسابات فاتورة دفع تحصيل متأخر رصيد",
      },
      {
        id: "payroll",
        title: "المصروفات والمستحقات",
        summary: "دورة اعتماد المصروفات وأجور المعلمين.",
        keywords: "مصروف راتب مستحق معلم اعتماد دفع",
      },
      {
        id: "reports",
        title: "التقارير ومؤشرات الأداء",
        summary: "الرؤية التنفيذية للتشغيل والمالية.",
        keywords: "تقارير KPI حضور تحويل تحصيل صافي جروبات معلمين",
      },
    ],
  },
  {
    label: "الفريق والحوكمة",
    items: [
      {
        id: "management",
        title: "إدارة الأكاديمية",
        summary: "الإعدادات والحسابات وسجل التدقيق.",
        keywords: "إعدادات أكاديمية موظف حساب صلاحية سجل تدقيق",
      },
      {
        id: "roles",
        title: "الأدوار والصلاحيات",
        summary: "مسؤولية كل عضو في الفريق.",
        keywords: "مدير قبول أكاديمي محاسب موظف معلم صلاحيات",
      },
      {
        id: "teacher-portal",
        title: "بوابة المعلم",
        summary: "اليوم والجروبات والتقارير والمستحقات.",
        keywords: "معلم حصص اليوم حضور تقييم تقرير مستحقات",
      },
      {
        id: "operating-rhythm",
        title: "روتين التشغيل",
        summary: "قوائم يومية وأسبوعية وشهرية.",
        keywords: "روتين يومي أسبوعي شهري مدير متابعة مراجعة",
      },
      {
        id: "golden-rules",
        title: "قواعد لا نتجاوزها",
        summary: "قواعد تحافظ على دقة البيانات.",
        keywords: "قواعد تحذير ممنوع تكرار فاتورة بيانات",
      },
      {
        id: "glossary",
        title: "الحالات والمصطلحات",
        summary: "المعاني الموحدة للكلمات والحالات.",
        keywords: "مصطلح حالة lead won invoice issued subscription",
      },
      {
        id: "troubleshooting",
        title: "حل المشكلات الشائعة",
        summary: "ماذا نفعل عند الخطأ أو نقص البيانات.",
        keywords: "مشكلة خطأ تعارض صلاحية دخول تحميل",
      },
    ],
  },
];

const docItems = docGroups.flatMap((group) => group.items);

const journeySteps = [
  "عميل جديد",
  "متابعة وتأهيل",
  "اختبار مستوى",
  "حصة تجريبية",
  "عرض وحجز",
  "تحويل لطالب",
  "دراسة وتقييم",
  "تجديد وتحصيل",
];

export function DocsContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("introduction");
  const workspaceHref = homeForRole(user?.role ?? "staff");

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return docItems.filter((item) =>
      `${item.title} ${item.summary} ${item.keywords}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-doc-section]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0.05, 0.2, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="grid items-start gap-8 xl:grid-cols-[270px_minmax(0,920px)] 2xl:grid-cols-[270px_minmax(0,920px)_190px]">
        <aside className="sticky top-[94px] hidden max-h-[calc(100vh-118px)] overflow-y-auto pl-2 xl:block print:hidden">
          <SearchBox query={query} setQuery={setQuery} />

          <nav className="mt-5 space-y-6" aria-label="أقسام دليل التشغيل">
            {docGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[8px] font-bold tracking-[0.12em] text-slate/60">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => jumpTo(item.id)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-[10px] transition ${
                          active
                            ? "bg-navy font-semibold text-white shadow-[0_8px_20px_rgba(11,36,84,.13)]"
                            : "text-slate hover:bg-white hover:text-navy"
                        }`}
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${
                            active ? "bg-sun" : "bg-teal/35"
                          }`}
                        />
                        <span className="min-w-0 flex-1">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          <DocsHero />

          <div className="mt-5 xl:hidden print:hidden">
            <SearchBox query={query} setQuery={setQuery} />
            <label className="mt-3 block">
              <span className="sr-only">انتقل إلى قسم</span>
              <select
                value={activeSection}
                onChange={(event) => jumpTo(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-navy/[0.09] bg-white px-3.5 text-[10px] font-semibold text-navy outline-none"
              >
                {docGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          {query.trim() ? (
            <SearchResults
              query={query}
              results={searchResults}
              onSelect={jumpTo}
            />
          ) : null}

          <div className="mt-8 space-y-7 print:space-y-4">
            <DocSection
              id="introduction"
              eyebrow="ابدأ من الصورة الكبيرة"
              title="النظام يربط رحلة الأكاديمية بالكامل"
              description="الفكرة ليست أن كل قسم يكتب بياناته وحده؛ كل إجراء صحيح يجهز الخطوة التالية تلقائيًا ويحافظ على سجل واحد للعميل والطالب."
              icon={Route}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <FeatureCard
                  icon={MessageCircleMore}
                  title="قبل التسجيل"
                  description="العميل، مصدره، الموظف المسؤول، التواصل، الاختبار، التجربة والعرض."
                />
                <FeatureCard
                  icon={GraduationCap}
                  title="بعد التسجيل"
                  description="الطالب، الجروب، الحضور، التقييمات، التقارير وخطط التحسين."
                />
                <FeatureCard
                  icon={WalletCards}
                  title="الجانب المالي"
                  description="الفاتورة، الدفعات، الاشتراك، التجديد، المصروفات ومستحقات المعلمين."
                />
              </div>
              <Callout tone="info" title="قاعدة الفهم الأساسية">
                العميل المحتمل ليس طالبًا بعد. يصبح طالبًا فقط عند تنفيذ «تسجيل
                العميل كطالب» من ملفه، لأن هذا الإجراء ينشئ ملف الطالب والتسجيل
                والفاتورة ويغلق المتابعات المفتوحة.
              </Callout>
            </DocSection>

            <DocSection
              id="quick-start"
              eyebrow="قبل إدخال بيانات حقيقية"
              title="أول يوم تشغيل للأكاديمية"
              description="نفذ هذه الخطوات بالترتيب مرة واحدة، ثم ابدأ تدريب كل موظف على الجزء المسؤول عنه."
              icon={Sparkles}
            >
              <StepList
                steps={[
                  {
                    title: "اعتماد إعدادات الأكاديمية",
                    body: "راجع الاسم، الهاتف، العملة، المنطقة الزمنية، أيام وساعات العمل، مدة العرض وحجز المقعد.",
                  },
                  {
                    title: "تنظيف البيانات التجريبية",
                    body: "لا تخلط المعلمين والعملاء والفواتير التجريبية مع بيانات التشغيل الحقيقي.",
                  },
                  {
                    title: "إنشاء حسابات الفريق",
                    body: "أنشئ حسابًا منفصلًا لكل موظف وحدد دوره الصحيح. لا يتشارك الموظفون حسابًا واحدًا.",
                  },
                  {
                    title: "تعريف البرامج والجروبات والباقات",
                    body: "ثبت المسارات، أنشئ الجروبات الفعلية، ثم عرّف الباقات التي ستستخدم في التجديد.",
                  },
                  {
                    title: "تنفيذ حالة تدريب كاملة",
                    body: "سجل عميلًا تجريبيًا ومرره من المتابعة حتى التسجيل والدفع والحضور، ثم احذف أو اعزل الحالة.",
                  },
                ]}
              />
              <Callout tone="warning" title="قبل التشغيل المالي">
                يجب اعتماد سياسة واحدة للرسوم الأولية والاشتراكات حتى لا تتكرر
                فاتورة التسجيل مع فاتورة الباقة.
              </Callout>
            </DocSection>

            <DocSection
              id="customer-journey"
              eyebrow="السيناريو القياسي"
              title="رحلة العميل من الرسالة إلى التجديد"
              description="هذا هو المسار الذي يجب أن يتعلمه فريق القبول والإدارة، ولا يتم تجاوز خطوة إلا لسبب موثق."
              icon={UserPlus}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {journeySteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-cloud/70 p-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy font-mono text-[9px] font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-semibold text-navy">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              <BulletList
                items={[
                  "سجل بيانات العميل ومصدره والبرنامج المهتم به.",
                  "حدد موظفًا مسؤولًا وموعد المتابعة التالية.",
                  "وثّق كل مكالمة أو رسالة وماذا تم الاتفاق عليه.",
                  "سجل اختبار المستوى ونتيجته، ثم التجربة وحالتها.",
                  "أنشئ العرض وحدد السعر والخصم وصلاحية العرض.",
                  "احجز المقعد أو أضف العميل لقائمة الانتظار.",
                  "حوّل العميل إلى طالب من ملفه بعد الاتفاق النهائي.",
                  "سجل الدفعات والحضور والتقدم، ثم تابع التجديد قبل الانتهاء.",
                ]}
              />
            </DocSection>

            <DocSection
              id="dashboard"
              eyebrow="للمدير والفريق"
              title="نظرة عامة"
              description="صورة الأكاديمية اليوم، وتتحدث تلقائيًا لتضع المشاكل التي تحتاج قرارًا أمامك."
              icon={LayoutDashboard}
              href="/dashboard"
            >
              <FeatureGrid
                items={[
                  ["عملاء قيد المتابعة", "كل الفرص التي لم تُغلق بعد."],
                  ["الطلاب النشطون", "عدد الطلاب المسجلين حاليًا."],
                  ["الجروبات النشطة", "الجروبات التي تعمل بالفعل."],
                  ["متابعات مطلوبة", "المواعيد القادمة والمتأخرة التي تحتاج إجراء."],
                  ["مسار التحويل", "توزيع العملاء على مراحل البيع ونسبة التحويل."],
                  ["آخر العملاء والجروبات", "وصول سريع لأحدث الفرص وحالة السعة."],
                ]}
              />
              <Callout tone="tip" title="استخدام المدير">
                ابدأ بها كل صباح. إذا وجدت متابعات متأخرة أو جروبًا يقترب من
                الامتلاء، انتقل مباشرة للتفاصيل ولا تنتظر التقرير الأسبوعي.
              </Callout>
            </DocSection>

            <DocSection
              id="leads"
              eyebrow="CRM · فريق القبول"
              title="العملاء والمتابعات"
              description="المكان الرئيسي لكل شخص تواصل مع الأكاديمية، سواء سجل لاحقًا أو لم يسجل."
              icon={MessageCircleMore}
              href="/leads"
            >
              <Subheading>إضافة عميل</Subheading>
              <BulletList
                items={[
                  "سجل الاسم والهاتف والبريد إن وجد.",
                  "حدد المصدر والبرنامج والوقت المفضل للتواصل.",
                  "عيّن موظفًا مسؤولًا عن العميل.",
                  "تأكد من البحث بالهاتف قبل الإضافة لتجنب التكرار.",
                ]}
              />
              <Subheading>عرض المسار والقائمة</Subheading>
              <FeatureGrid
                items={[
                  ["مسار Pipeline", "أعمدة وكروت مع سحب وإفلات بين المراحل."],
                  ["قائمة", "جدول للبحث والفلترة والمراجعة الدقيقة."],
                  ["المتأخرة فقط", "يعرض العملاء الذين فات موعد متابعتهم."],
                  ["بحث موحد", "بالاسم أو الهاتف أو البريد."],
                ]}
              />
              <Subheading>مراحل العميل</Subheading>
              <StatusFlow
                items={[
                  ["جديد", "لم يبدأ التواصل الجاد بعد."],
                  ["تم التواصل", "تمت أول مكالمة أو رسالة."],
                  ["مؤهل", "الاحتياج والميزانية والبرنامج مناسبون."],
                  ["اختبار مستوى", "تم تحديد أو تنفيذ الاختبار."],
                  ["حصة تجريبية", "تم حجز تجربة داخل جروب."],
                  ["تم التسجيل", "أنشئ النظام ملف الطالب والتسجيل."],
                  ["غير مهتم", "الفرصة مغلقة مع توثيق السبب."],
                ]}
              />
              <Subheading>داخل ملف العميل</Subheading>
              <BulletList
                items={[
                  "إضافة متابعة بموضوع وموعد وأولوية.",
                  "إكمال المتابعة بعد تنفيذها حتى لا تظل متأخرة.",
                  "تسجيل مكالمة أو رسالة أو ملاحظة في سجل النشاط.",
                  "حجز اختبار مستوى وتسجيل النتيجة والمستوى المقترح.",
                  "حجز تجربة مرتبطة بجروب وموعد ومكان حقيقي.",
                  "إنشاء عرض بسعر وخصم وصلاحية وحجز مقعد اختياري.",
                  "حجز مقعد مباشرة أو دخول قائمة انتظار عند اكتمال السعة.",
                  "تسجيل العميل كطالب بعد الاتفاق النهائي.",
                ]}
              />
              <Callout tone="warning" title="ممنوع نقل العميل إلى «تم التسجيل» بالسحب">
                استخدم زر تسجيل العميل كطالب. السحب وحده لا ينشئ طالبًا أو
                تسجيلًا أو فاتورة.
              </Callout>
            </DocSection>

            <DocSection
              id="admissions"
              eyebrow="Admissions Command Center"
              title="القبول والتجارب"
              description="لوحة تنفيذية تجمع عناصر القبول من جميع العملاء بدل فتح كل ملف على حدة."
              icon={Tickets}
              href="/admissions"
            >
              <FeatureGrid
                items={[
                  ["العروض", "قيمة العرض، الجروب، الصلاحية، الإرسال والقبول."],
                  ["التجارب", "الموعد والمكان وتأكيد الحضور والنتيجة."],
                  ["قائمة الانتظار", "الترتيب وتقديم عرض مقعد عند توفره."],
                  ["حجز المقاعد", "المقاعد المحجوزة مؤقتًا وموعد انتهائها."],
                ]}
              />
              <BulletList
                items={[
                  "العرض يبدأ كمسودة، ثم يُرسل، ثم تسجل موافقة العميل.",
                  "التجربة تُحدّث إلى: مؤكدة، حضر، لم يحضر، أو ملغاة.",
                  "عند توفر مقعد استخدم «عرض مقعد» للشخص المناسب في الانتظار.",
                  "حرر الحجز إذا اعتذر العميل أو انتهت المهلة حتى تعود السعة للجروب.",
                ]}
              />
              <Callout tone="info" title="الفرق عن CRM">
                CRM يحفظ قصة كل عميل، أما شاشة القبول فتعطي مسؤول القبول قائمة
                تشغيل يومية بكل العروض والتجارب والحجوزات.
              </Callout>
            </DocSection>

            <DocSection
              id="groups"
              eyebrow="Academic Operations"
              title="الجروبات والحصص"
              description="الجروب هو وحدة التشغيل الأساسية بعد التسجيل: معلم وطلاب وسعة وجدول وحصص وحضور."
              icon={UsersRound}
              href="/groups"
            >
              <Subheading>إنشاء جروب</Subheading>
              <BulletList
                items={[
                  "حدد الاسم والكود والبرنامج والمستوى والحالة.",
                  "اختر المعلم أو اتركه ليُعيّن لاحقًا.",
                  "حدد أونلاين أو حضوري أو هجين، والرابط أو القاعة.",
                  "أدخل السعة والرسوم وتاريخ البداية والنهاية.",
                  "احفظ موعدًا أو موعدين أسبوعيين على الأقل.",
                ]}
              />
              <Subheading>حالات الجروب</Subheading>
              <StatusFlow
                items={[
                  ["مخطط", "تجهيز داخلي ولم يُفتح التسجيل."],
                  ["متاح التسجيل", "يمكن حجز وتحويل طلاب إليه."],
                  ["نشط", "الدراسة بدأت والحصص تعمل."],
                  ["مكتمل", "انتهت الدورة وتم حفظ تاريخها."],
                  ["ملغى", "لن يبدأ أو توقف نهائيًا."],
                ]}
              />
              <Subheading>لوحة الجروب</Subheading>
              <FeatureGrid
                items={[
                  ["السعة", "مسجلون، محجوزون، أماكن متاحة وانتظار."],
                  ["الحصص", "إضافة حصة أو توليد جدول كامل من المواعيد الأسبوعية."],
                  ["الحضور", "حاضر، متأخر، غائب، اعتذار لكل طالب."],
                  ["التقييم", "درجة وملاحظة قابلة للمتابعة في ملف الطالب."],
                  ["الطلاب", "قائمة التسجيل الحالية وروابط ملفات الطلاب."],
                  ["الانتظار", "العملاء الذين ينتظرون مكانًا في هذا الجروب."],
                ]}
              />
              <Callout tone="tip" title="توليد الجدول">
                بعد تثبيت المواعيد وتواريخ الجروب، استخدم «توليد جدول الحصص».
                النظام يتجاوز الإجازات والمواعيد المكررة تلقائيًا.
              </Callout>
            </DocSection>

            <DocSection
              id="calendar"
              eyebrow="الرؤية الأسبوعية"
              title="تقويم الأكاديمية"
              description="مكان واحد لمراجعة كل حصص الأسبوع والتحرك بين الأسابيع."
              icon={CalendarDays}
              href="/calendar"
            >
              <FeatureGrid
                items={[
                  ["كل الحصص", "مواعيد البداية والنهاية والجروب والمعلم."],
                  ["فلتر المعلم", "جدول شخص محدد وعبئه خلال الأسبوع."],
                  ["فلتر الجروب", "كل حصص جروب واحد."],
                  ["فلتر الحالة", "مجدولة أو مكتملة أو ملغاة."],
                ]}
              />
              <BulletList
                items={[
                  "راجع التقويم قبل نقل جروب لمعلم جديد.",
                  "استخدم الأسبوع السابق لمراجعة التنفيذ، والقادم للتخطيط.",
                  "الحصة المكتملة تدخل في إحصاءات الحضور ومستحقات المعلم.",
                  "النظام يمنع إسناد مواعيد متعارضة لنفس المعلم.",
                ]}
              />
            </DocSection>

            <DocSection
              id="students"
              eyebrow="الملف الموحد"
              title="الطلاب"
              description="لا يُنشأ الطالب يدويًا؛ يأتي من تحويل عميل مكتمل حتى يبقى تاريخ القبول محفوظًا."
              icon={GraduationCap}
              href="/students"
            >
              <FeatureGrid
                items={[
                  ["بيانات الطالب", "الكود، الهاتف، البريد وتاريخ الانضمام."],
                  ["ولي الأمر", "الاسم والهاتف والحساب المرتبط إن وجد."],
                  ["التسجيل", "الجروب والبرنامج والمستوى والرسوم."],
                  ["المالية", "الفواتير وما تم دفعه والرصيد."],
                  ["الأكاديمي", "الحضور والتقييمات وملاحظات التقدم."],
                  ["الحالة", "نشط أو غير نشط مع الاحتفاظ بالتاريخ."],
                ]}
              />
              <Callout tone="info" title="عند طلب نقل طالب">
                راجع أولًا الجروب الحالي والسعة في الجروب الجديد وأثر النقل على
                الفواتير والاشتراك، ثم نفذ الإجراء من مسار التشغيل المعتمد.
              </Callout>
            </DocSection>

            <DocSection
              id="teachers"
              eyebrow="People Operations"
              title="المعلمون"
              description="إدارة الملف المهني وحساب الدخول والتوفر والإسناد وقاعدة المستحقات من شاشة واحدة."
              icon={UsersRound}
              href="/teachers"
            >
              <Subheading>إضافة أو تعديل معلم</Subheading>
              <BulletList
                items={[
                  "الاسم والبريد والهاتف والتخصص والنبذة المهنية.",
                  "دوام كامل أو جزئي، وحالة الحساب نشط أو موقوف.",
                  "أيام التوفر الأسبوعي المستخدمة عند الإسناد.",
                  "سعر بالساعة أو مبلغ ثابت للحصة.",
                  "كلمة مرور مؤقتة تسمح للمعلم بالدخول مباشرة.",
                ]}
              />
              <Subheading>إسناد الجروبات</Subheading>
              <BulletList
                items={[
                  "اختر الجروبات الحالية للمعلم من نافذة «الجروبات».",
                  "اختيار جروب لمعلم آخر يعني نقله بعد فحص التعارض.",
                  "خيار تحديث الحصص القادمة يغير المعلم في المواعيد المستقبلية فقط.",
                  "الحصص المكتملة وتاريخ المستحقات لا يتغيران.",
                  "لا يمكن إيقاف معلم لديه جروبات نشطة قبل إعادة إسنادها.",
                ]}
              />
              <Subheading>ملف المعلم التشغيلي</Subheading>
              <FeatureGrid
                items={[
                  ["العبء", "الجروبات والطلاب تحت الإشراف."],
                  ["التنفيذ", "الحصص المكتملة والقادمة."],
                  ["التقارير", "نسبة اكتمال تقارير الطلاب."],
                  ["المستحقات", "مستحق الشهر وآخر البنود المحسوبة."],
                ]}
              />
            </DocSection>

            <DocSection
              id="levels"
              eyebrow="Catalog"
              title="المستويات والمناهج"
              description="مرجع لمسارات التعلم وترتيب المستويات والجروبات المرتبطة بكل مستوى."
              icon={BookMarked}
              href="/levels"
            >
              <BulletList
                items={[
                  "كل برنامج يحتوي مستويات مرتبة تمثل مسار التقدم.",
                  "الجروب يرتبط ببرنامج ومستوى واحد واضح.",
                  "استخدم نفس أسماء المستويات في القبول والجروبات والتقارير.",
                  "راجع الجروبات المفتوحة والنشطة المرتبطة بكل مستوى.",
                ]}
              />
              <Callout tone="info" title="الوضع الحالي">
                الشاشة الحالية للعرض والربط. إنشاء وتعديل البرامج والمستويات
                بالكامل يحتاج واجهة إدارة إضافية في مرحلة قادمة.
              </Callout>
            </DocSection>

            <DocSection
              id="progress"
              eyebrow="Academic Quality"
              title="التقدم والتقارير الأكاديمية"
              description="مركز اكتشاف التراجع مبكرًا وتحويل الملاحظة إلى خطة قابلة للمتابعة."
              icon={ChartNoAxesCombined}
              href="/progress"
            >
              <FeatureGrid
                items={[
                  ["مؤشرات الطالب", "نسبة الحضور ومتوسط التقييم وعدد التقييمات."],
                  ["تنبيه أكاديمي", "نوع المشكلة ودرجة الخطورة والوصف."],
                  ["خطة تدخل", "الإجراء والمسؤول وموعد المراجعة ومؤشر النجاح."],
                  ["تقرير دوري", "ملخص ونقاط قوة وتحسين وخطوات قادمة."],
                ]}
              />
              <Subheading>دورة العمل</Subheading>
              <StepList
                compact
                steps={[
                  {
                    title: "رصد",
                    body: "المعلم أو المدير يلاحظ غيابًا أو تراجعًا أو مشكلة سلوكية.",
                  },
                  {
                    title: "تنبيه",
                    body: "تسجيل نوع الخطر ودرجته حتى يظهر في لوحة المتابعة.",
                  },
                  {
                    title: "تدخل",
                    body: "اتصال بولي الأمر، حصة دعم، خطة تدريب أو متابعة معلم.",
                  },
                  {
                    title: "مراجعة",
                    body: "إغلاق التدخل أو استمرار المتابعة بناءً على النتيجة.",
                  },
                  {
                    title: "تقرير",
                    body: "إنشاء مسودة، مراجعتها، ثم نشرها لولي الأمر.",
                  },
                ]}
              />
              <Callout tone="warning" title="النشر مسؤولية">
                لا تنشر تقريرًا لولي الأمر قبل مراجعة اللغة والدرجة والخطوات
                القادمة. المسودة داخلية، أما المنشور فيظهر في بوابة الأسرة.
              </Callout>
            </DocSection>

            <DocSection
              id="communications"
              eyebrow="Family Communication"
              title="مركز التواصل"
              description="سجل مركزي للرسائل المرتبطة بولي الأمر والطالب، مع قوالب موحدة للفريق."
              icon={MessageSquareText}
              href="/communications"
            >
              <BulletList
                items={[
                  "اختر ولي الأمر والطالب المرتبط بالرسالة.",
                  "استخدم قالبًا جاهزًا أو اكتب عنوانًا ونصًا واضحين.",
                  "حدد القناة: داخل البوابة، WhatsApp، البريد أو SMS.",
                  "راجع حالة الرسالة: مسودة، بانتظار الربط، مرسلة أو مسلمة.",
                  "اكتب ما يمكن لأي موظف فهمه دون الرجوع للمرسل.",
                ]}
              />
              <Callout tone="warning" title="قنوات الإرسال الخارجية">
                التسجيل داخل النظام يعمل الآن. الإرسال الفعلي عبر WhatsApp
                والبريد وSMS يحتاج ربط مزودي الخدمة الرسميين أولًا.
              </Callout>
            </DocSection>

            <DocSection
              id="service-requests"
              eyebrow="Family Care"
              title="طلبات أولياء الأمور"
              description="صندوق خدمة موحد للأسئلة والشكاوى بدل ضياعها بين الرسائل الشخصية."
              icon={LifeBuoy}
              href="/service-requests"
            >
              <FeatureGrid
                items={[
                  ["التصنيف", "أكاديمي، مواعيد، حسابات، تقني، شكوى أو أخرى."],
                  ["الأولوية", "عادي، مهم أو عاجل."],
                  ["المسؤول", "الموظف الذي استلم الطلب ويتابعه."],
                  ["الحالة", "جديد، قيد المعالجة، تم الحل أو مغلق."],
                ]}
              />
              <StepList
                compact
                steps={[
                  {
                    title: "استلام",
                    body: "الموظف يضغط استلام فيتغير المسؤول والحالة.",
                  },
                  {
                    title: "معالجة",
                    body: "يتواصل مع القسم المناسب وينفذ الإجراء المطلوب.",
                  },
                  {
                    title: "تسجيل الحل",
                    body: "يكتب ما تم الاتفاق عليه أو تنفيذه بوضوح.",
                  },
                  {
                    title: "إغلاق",
                    body: "لا يغلق الطلب قبل التأكد أن الأسرة استلمت الحل.",
                  },
                ]}
              />
            </DocSection>

            <DocSection
              id="family-portal"
              eyebrow="بوابة الأسرة"
              title="ما يراه ولي الأمر"
              description="واجهة منفصلة تعرض فقط بيانات الأبناء المرتبطين بحسابه."
              icon={Building2}
            >
              <FeatureGrid
                items={[
                  ["الأبناء", "الجروب والمستوى والمعلم ونظام الدراسة."],
                  ["الحضور", "آخر الحصص وحالة حضور الطالب."],
                  ["التقدم", "التقييمات والتقارير المنشورة فقط."],
                  ["المالية", "الفواتير والمدفوعات والرصيد المستحق."],
                  ["الرسائل", "رسائل الأكاديمية داخل البوابة."],
                  ["المساعدة", "إنشاء طلب خدمة ومتابعة حالته."],
                ]}
              />
              <Callout tone="info" title="حسابات أولياء الأمور">
                البوابة جاهزة للحسابات المرتبطة. إدارة إنشاء وربط حسابات أولياء
                الأمور على نطاق واسع تحتاج استكمال واجهة تشغيل مخصصة قبل تعميمها.
              </Callout>
            </DocSection>

            <DocSection
              id="subscriptions"
              eyebrow="Billing Lifecycle"
              title="الاشتراكات والتجديد"
              description="تعريف ما اشتراه الطالب ومدة الاستفادة وعدد الحصص وخطة الأقساط."
              icon={BadgeDollarSign}
              href="/subscriptions"
            >
              <Subheading>الباقة</Subheading>
              <BulletList
                items={[
                  "البرنامج والمستوى واسم وكود الباقة.",
                  "عدد الحصص ومدة الباقة بالأسابيع.",
                  "السعر وعدد الأقساط الافتراضي.",
                ]}
              />
              <Subheading>الاشتراك</Subheading>
              <BulletList
                items={[
                  "اختر الطالب وتسجيله والجروب والباقة وتاريخ البداية.",
                  "حدد الأقساط والخصم، وينشئ النظام الجدول والفواتير.",
                  "جمّد الاشتراك عند التوقف المؤقت مع السبب وتاريخ العودة.",
                  "عند إعادة التفعيل يمتد تاريخ النهاية بأيام التجميد.",
                  "استخدم التجديد لإنشاء اشتراك جديد مرتبط بالسابق.",
                ]}
              />
              <Callout tone="warning" title="منع تكرار الرسوم">
                تحويل العميل إلى طالب ينشئ فاتورة تسجيل الجروب بالفعل. لا تنشئ
                اشتراكًا أوليًا لنفس الرسوم إلا حسب السياسة المالية المعتمدة؛
                استخدم الباقات للتجديدات أو الرسوم المنفصلة حتى يتم توحيد الربط.
              </Callout>
            </DocSection>

            <DocSection
              id="finance"
              eyebrow="Finance"
              title="الحسابات والتحصيل"
              description="مراجعة الفواتير والمتبقي والمتأخر وتسجيل كل دفعة بمرجع واضح."
              icon={ReceiptText}
              href="/finance"
            >
              <FeatureGrid
                items={[
                  ["إجمالي الفواتير", "قيمة ما صدر على الطلاب."],
                  ["تم تحصيله", "إجمالي الدفعات المسجلة."],
                  ["الرصيد المستحق", "الفرق الذي ما زال مطلوبًا."],
                  ["متأخر", "فواتير تجاوزت تاريخ الاستحقاق."],
                ]}
              />
              <Subheading>تسجيل دفعة</Subheading>
              <BulletList
                items={[
                  "افتح الفاتورة الصحيحة وتأكد من اسم الطالب ورقم الفاتورة.",
                  "سجل قيمة الدفعة ووسيلة الدفع.",
                  "أدخل رقم التحويل أو المرجع البنكي إن وجد.",
                  "اكتب ملاحظة عند وجود تسوية أو جزء غير معتاد.",
                  "لا تسجل مبلغًا أكبر من الرصيد المتبقي دون مراجعة.",
                ]}
              />
              <Callout tone="tip" title="المصدر المالي">
                شاشة الحسابات لا تُستخدم لكتابة مبيعات من الذاكرة؛ الفواتير
                تأتي من التسجيل أو الاشتراك، والمحاسب يسجل ما تم تحصيله فعليًا.
              </Callout>
            </DocSection>

            <DocSection
              id="payroll"
              eyebrow="Expenses & Payroll"
              title="المصروفات ومستحقات المعلمين"
              description="فصل تكلفة التدريس عن مصروفات التشغيل مع دورة مراجعة واعتماد ودفع."
              icon={HandCoins}
              href="/payroll"
            >
              <Subheading>مستحقات المعلمين</Subheading>
              <StatusFlow
                items={[
                  ["قيد المراجعة", "تم حسابها من حصة مكتملة وتحتاج تدقيقًا."],
                  ["تم الاعتماد", "راجعها المسؤول وأصبحت جاهزة للدفع."],
                  ["تم الدفع", "تم تسجيل الدفع للمعلم."],
                ]}
              />
              <BulletList
                items={[
                  "الحصة المكتملة تنشئ مستحقًا طبقًا لقاعدة المعلم.",
                  "السعر بالساعة يعتمد على مدة الحصة، والثابت يعتمد على الحصة.",
                  "لا تعتمد بندًا قبل مراجعة الحصة والجروب والمعلم والمدة.",
                ]}
              />
              <Subheading>مصروفات التشغيل</Subheading>
              <BulletList
                items={[
                  "سجل التصنيف والمورد والوصف والمبلغ والتاريخ.",
                  "أضف ملاحظة أو مرجعًا يشرح سبب المصروف.",
                  "المصروف يمر من مقدم إلى معتمد ثم مدفوع.",
                  "لا تجمع عدة مصروفات مختلفة في بند واحد إذا كان يمكن فصلها.",
                ]}
              />
            </DocSection>

            <DocSection
              id="reports"
              eyebrow="Executive Intelligence"
              title="التقارير ومؤشرات الأداء"
              description="شاشة الإدارة العليا لمعرفة هل الأكاديمية تتحسن وأين يوجد الاختناق."
              icon={BarChart3}
              href="/reports"
            >
              <FeatureGrid
                items={[
                  ["الأكاديمي", "الطلاب والجروبات والحضور وإكمال الحصص."],
                  ["النمو", "تحويل العملاء ومصادر الفرص."],
                  ["التحصيل", "الفواتير والمتحصل والمتبقي والمتأخر."],
                  ["التكلفة", "المصروفات وتكلفة المعلمين والصافي التشغيلي."],
                  ["صحة الجروبات", "السعة والحضور والتنفيذ لكل جروب."],
                  ["أحمال المعلمين", "الجروبات والطلاب والحصص المكتملة."],
                ]}
              />
              <Callout tone="tip" title="لا تقرأ الرقم وحده">
                انخفاض التحصيل قد يكون سببه تجديدات متأخرة، وانخفاض التحويل قد
                يكون سببه متابعات متأخرة أو تجارب لم تُغلق. انتقل دائمًا للمصدر.
              </Callout>
            </DocSection>

            <DocSection
              id="management"
              eyebrow="Academy Control Center"
              title="إدارة الأكاديمية"
              description="إعدادات المؤسسة وحسابات الموظفين والصلاحيات وسجل كل تغيير حساس. متاحة للمدير فقط."
              icon={Settings2}
              href="/management"
            >
              <FeatureGrid
                items={[
                  ["هوية الأكاديمية", "الاسم والهاتف وواتساب والبريد والموقع والعنوان."],
                  ["التشغيل", "أيام وساعات العمل والمنطقة الزمنية والعملة."],
                  ["القواعد", "بادئة الفواتير والطلاب وصلاحية العرض وحجز المقعد."],
                  ["الفريق", "إنشاء الحسابات وتعديل الدور والحالة وكلمة المرور."],
                  ["الصلاحيات", "خريطة توضح ما يستطيع كل دور الوصول إليه."],
                  ["سجل التدقيق", "من غيّر ماذا ومتى وفي أي قسم."],
                ]}
              />
              <BulletList
                items={[
                  "أنشئ حسابًا مستقلًا لكل موظف.",
                  "أوقف الحساب بدل حذفه حتى يبقى تاريخ عملياته.",
                  "عند تغيير كلمة المرور تُغلق الجلسات المفتوحة للحساب.",
                  "راجع سجل التدقيق عند أي اختلاف مالي أو تعديل حساس.",
                ]}
              />
            </DocSection>

            <DocSection
              id="roles"
              eyebrow="من يعمل على ماذا؟"
              title="الأدوار والصلاحيات"
              description="كل موظف يرى الأدوات اللازمة لدوره فقط؛ المدير يحتفظ بالإعدادات والاعتمادات الحساسة."
              icon={ShieldCheck}
            >
              <RoleGrid />
              <Callout tone="warning" title="لا تشارك الحسابات">
                معرفة من نفذ الإجراء تعتمد على دخول كل موظف بحسابه. مشاركة
                الحساب تلغي قيمة سجل التدقيق والمساءلة.
              </Callout>
            </DocSection>

            <DocSection
              id="teacher-portal"
              eyebrow="مساحة المعلم"
              title="بوابة المعلم"
              description="واجهة مركزة تمنح المعلم ما يحتاجه للتدريس فقط دون بيانات المبيعات أو الحسابات الإدارية."
              icon={ClipboardCheck}
            >
              <FeatureGrid
                items={[
                  ["يومي وحصصي", "حصص اليوم والقادم خلال سبعة أيام."],
                  ["جروباتي وطلابي", "الجروبات المسندة وقوائم الطلاب."],
                  ["الحضور والتقييم", "تسجيل الحضور وملاحظات التقدم."],
                  ["تقارير ناقصة", "تنبيه بالتقارير التي تحتاج إكمالًا."],
                  ["الجدول", "التقويم الأسبوعي لحصص المعلم."],
                  ["مستحقاتي", "تفاصيل كل مبلغ وحالة الاعتماد والدفع."],
                ]}
              />
              <Callout tone="info" title="مسؤولية المعلم">
                تسجيل الحضور في نفس يوم الحصة، إضافة تقييم واضح، وإكمال التقارير
                المطلوبة. عدم تسجيل الحصة يؤثر على التقدم والمستحقات والتقارير.
              </Callout>
            </DocSection>

            <DocSection
              id="operating-rhythm"
              eyebrow="SOP"
              title="روتين التشغيل اليومي والأسبوعي والشهري"
              description="قوائم ثابتة تمنع الاعتماد على الذاكرة وتضمن أن كل قسم يغلق مسؤولياته."
              icon={Clock3}
            >
              <ChecklistGroup
                title="يوميًا"
                items={[
                  "فتح لوحة النظرة العامة ومراجعة التنبيهات.",
                  "توزيع العملاء الجدد وإغلاق المتابعات المتأخرة.",
                  "مراجعة تجارب وحصص اليوم.",
                  "تسجيل حضور كل حصة مكتملة.",
                  "استلام طلبات أولياء الأمور العاجلة.",
                  "تسجيل الدفعات المستلمة في نفس اليوم.",
                ]}
              />
              <ChecklistGroup
                title="أسبوعيًا"
                items={[
                  "مراجعة مسار العملاء ونسبة التحويل لكل مرحلة.",
                  "مراجعة سعة الجروبات وقوائم الانتظار.",
                  "مراجعة تعارضات وأحمال المعلمين للأسبوع القادم.",
                  "مراجعة الطلاب الذين يحتاجون تدخلًا.",
                  "مراجعة الفواتير المتأخرة والتجديدات القادمة.",
                ]}
              />
              <ChecklistGroup
                title="شهريًا"
                items={[
                  "مراجعة التحصيل والمصروفات والصافي التشغيلي.",
                  "اعتماد مستحقات المعلمين وتسجيل المدفوع.",
                  "مراجعة تقارير التقدم المنشورة للأسر.",
                  "مراجعة أداء مصادر العملاء والجروبات والمعلمين.",
                  "مراجعة حسابات الموظفين وسجل التدقيق.",
                ]}
              />
            </DocSection>

            <DocSection
              id="golden-rules"
              eyebrow="Data Quality"
              title="قواعد لا نتجاوزها"
              description="هذه القواعد تحمي الأرقام والتاريخ التشغيلي من التكرار أو القرارات غير القابلة للمراجعة."
              icon={AlertTriangle}
            >
              <div className="grid gap-3">
                {[
                  ["ابحث قبل الإضافة", "استخدم الهاتف للبحث عن العميل قبل إنشاء سجل جديد."],
                  ["كل عميل له مسؤول", "لا تترك فرصة مفتوحة دون شخص وموعد متابعة."],
                  ["لا تسجل الفوز بالسحب", "تحويل العميل لطالب يتم من ملفه فقط."],
                  ["الحضور في نفس اليوم", "لا تؤجل تسجيل الحضور لأنه يؤثر على التقارير والمستحقات."],
                  ["لا تكرر الرسوم", "راجع فاتورة التسجيل قبل إنشاء اشتراك أو فاتورة مرتبطة بنفس الخدمة."],
                  ["لا تعدّل التاريخ المكتمل", "الحصص والفواتير والمدفوعات المكتملة تظل كسجل؛ التصحيح يكون موثقًا."],
                  ["المسودة قبل النشر", "التقرير الأكاديمي يراجع قبل ظهوره لولي الأمر."],
                  ["حساب لكل شخص", "ممنوع مشاركة كلمات المرور بين الموظفين."],
                ].map(([title, body], index) => (
                  <div
                    key={title}
                    className="flex gap-3 rounded-xl border border-rose-100 bg-rose-50/55 p-3.5"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-[9px] font-bold text-rose-700 shadow-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-rose-950">{title}</p>
                      <p className="mt-1 text-[9px] leading-5 text-rose-900/65">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection
              id="glossary"
              eyebrow="مرجع سريع"
              title="الحالات والمصطلحات"
              description="استخدم هذه المعاني نفسها في كلام الفريق حتى لا تحمل الحالة أكثر من تفسير."
              icon={BookOpenText}
            >
              <DefinitionList
                items={[
                  ["عميل Lead", "شخص تواصل مع الأكاديمية ولم يصبح طالبًا بعد."],
                  ["طالب Student", "عميل تم تحويله وأنشئ له ملف وتسجيل فعلي."],
                  ["جروب Cohort", "مجموعة دراسية لها برنامج ومستوى ومعلم وسعة وجدول."],
                  ["تسجيل Enrollment", "ربط طالب بجروب ورسوم وحالة دراسية."],
                  ["حجز مقعد Hold", "مكان محجوز مؤقتًا لعميل حتى موعد محدد."],
                  ["قائمة انتظار", "عميل يريد جروبًا لا توجد به سعة الآن."],
                  ["فاتورة صادرة", "مبلغ مطلوب من الطالب وله تاريخ استحقاق."],
                  ["مدفوعة جزئيًا", "تم تحصيل جزء وما زال هناك رصيد."],
                  ["متأخرة", "تجاوزت تاريخ الاستحقاق وبها رصيد."],
                  ["اشتراك نشط", "الباقة سارية داخل تاريخها ولم تُجمّد أو تنتهِ."],
                  ["حصة مكتملة", "تم تنفيذها وتدخل في الحضور والتقارير ومستحق المعلم."],
                  ["تقرير مسودة", "داخلي ولم يظهر لولي الأمر."],
                  ["تقرير منشور", "تمت مراجعته وأصبح ظاهرًا للأسرة."],
                ]}
              />
            </DocSection>

            <DocSection
              id="troubleshooting"
              eyebrow="عند حدوث مشكلة"
              title="حل المشكلات الشائعة"
              description="ابدأ بالسبب التشغيلي الأبسط، ولا تعالج المشكلة بإنشاء بيانات مكررة."
              icon={CircleHelp}
            >
              <DefinitionList
                items={[
                  ["لا أرى شاشة معينة", "راجع دور الحساب وصلاحياته. بعض الشاشات للمدير أو المدير الأكاديمي أو المحاسب فقط."],
                  ["العميل مكرر", "استخدم البحث بالهاتف وافتح السجل الأصلي. لا تكمل العمل على نسختين."],
                  ["لا يمكن تحويل العميل", "تأكد من وجود جروب متاح التسجيل أو نشط وبه مقعد متاح."],
                  ["لا يمكن إسناد معلم", "راجع تعارض مواعيد حصصه والجروبات الحالية."],
                  ["لا يمكن إيقاف معلم", "أعد إسناد جروباته النشطة أولًا."],
                  ["المستحق لم يظهر", "تأكد أن الحصة مكتملة وأن للمعلم قاعدة مستحقات فعالة."],
                  ["الرصيد غير صحيح", "راجع فواتير التسجيل والاشتراك والدفعات قبل إضافة أي بند جديد."],
                  ["الرسالة بانتظار الربط", "القناة الخارجية لم تُربط بعد؛ السجل محفوظ داخل النظام."],
                  ["ولي الأمر لا يرى التقرير", "تأكد أن التقرير منشور وليس مسودة وأن حساب الأسرة مرتبط بالطالب."],
                  ["الصفحة لا تحمل", "حدّث الصفحة مرة واحدة، ثم سجل الوقت والشاشة والإجراء وأبلغ المسؤول التقني."],
                ]}
              />
              <Callout tone="tip" title="عند طلب الدعم">
                أرسل اسم الشاشة، اسم السجل أو رقمه، وقت المشكلة، والخطوات التي
                نفذتها. لا ترسل كلمة المرور أو بيانات دفع حساسة.
              </Callout>
            </DocSection>
          </div>

          <footer className="mt-10 rounded-3xl bg-navy p-6 text-white shadow-[0_18px_44px_rgba(11,36,84,.13)] print:hidden sm:p-8">
            <p className="text-[9px] font-semibold tracking-[0.12em] text-teal">
              EDUSTEP OPERATIONS PLAYBOOK
            </p>
            <h2 className="mt-3 text-xl font-bold">
              الدليل مرجع للعمل، والنظام هو مصدر الحقيقة.
            </h2>
            <p className="mt-3 max-w-2xl text-[10px] leading-7 text-white/60">
              إذا اختلفت رسالة أو ملف خارجي مع البيانات المسجلة، راجع السجل
              داخل النظام وسجل التدقيق قبل اتخاذ القرار.
            </p>
            <Link
              href={workspaceHref}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-[9px] font-semibold text-navy"
            >
              العودة لمساحة العمل
              <ArrowLeft size={14} className="text-teal" />
            </Link>
          </footer>
        </article>

        <aside className="sticky top-[94px] hidden 2xl:block print:hidden">
          <div className="rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-[0_8px_24px_rgba(11,36,84,.035)]">
            <p className="text-[9px] font-bold text-navy">استخدم الدليل هكذا</p>
            <div className="mt-4 space-y-3">
              {[
                ["01", "ابحث عن المهمة"],
                ["02", "راجع الخطوات والتحذير"],
                ["03", "افتح الشاشة من الرابط"],
                ["04", "سجل الإجراء في النظام"],
              ].map(([number, label]) => (
                <div key={number} className="flex items-center gap-2.5">
                  <span className="font-mono text-[8px] font-bold text-teal">
                    {number}
                  </span>
                  <span className="text-[8px] leading-4 text-slate">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function DocsHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-navy px-5 py-8 text-white shadow-[0_24px_60px_rgba(11,36,84,.16)] sm:px-8 sm:py-10 lg:px-11 lg:py-12">
      <div className="absolute -left-20 -top-24 size-72 rounded-full bg-teal/15 blur-3xl" />
      <div className="absolute -bottom-20 right-1/3 size-52 rounded-full bg-sun/10 blur-3xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[8px] font-semibold text-white/70">
          <BookOpenText size={13} className="text-sun" />
          دليل تشغيل أكاديمية EduStep
        </span>
        <h1 className="mt-5 max-w-3xl text-2xl font-bold leading-[1.55] sm:text-3xl lg:text-[38px]">
          كل ما يحتاجه الفريق لتشغيل الأكاديمية بثقة.
        </h1>
        <p className="mt-4 max-w-3xl text-[11px] leading-8 text-white/60 sm:text-xs">
          شرح عملي لكل شاشة، من المسؤول عنها، متى تستخدم، والخطوات الصحيحة من
          أول رسالة للعميل حتى التجديد والتقارير والإدارة المالية.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {["26 قسمًا عمليًا", "كل أدوار الفريق", "خطوات وتحذيرات", "مناسب للطباعة"].map(
            (label) => (
              <span
                key={label}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[8px] font-medium text-white/65"
              >
                {label}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function SearchBox({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-white px-3.5 text-slate shadow-[0_7px_22px_rgba(11,36,84,.03)]">
      <Search size={16} />
      <span className="sr-only">البحث في دليل التشغيل</span>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ابحث في الدليل..."
        className="min-w-0 flex-1 bg-transparent text-[10px] text-ink outline-none placeholder:text-slate/55"
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="rounded-md px-1.5 py-1 text-[8px] font-semibold text-teal"
        >
          مسح
        </button>
      ) : null}
    </label>
  );
}

function SearchResults({
  query,
  results,
  onSelect,
}: {
  query: string;
  results: DocItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-teal/15 bg-mist/45 p-4 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-navy">نتائج البحث</p>
          <p className="mt-1 text-[8px] text-slate">
            {results.length} نتيجة لعبارة «{query}»
          </p>
        </div>
        <Search size={18} className="text-teal" />
      </div>
      {results.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="rounded-xl border border-navy/[0.06] bg-white p-3 text-right transition hover:border-teal/25"
            >
              <p className="text-[9px] font-bold text-navy">{item.title}</p>
              <p className="mt-1 text-[8px] leading-4 text-slate">{item.summary}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-white p-3 text-[9px] text-slate">
          لا توجد نتيجة مباشرة. جرّب كلمة مثل: عميل، فاتورة، معلم، حضور أو تجديد.
        </p>
      )}
    </section>
  );
}

function DocSection({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
  href,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-doc-section
      className="scroll-mt-28 rounded-[24px] border border-navy/[0.065] bg-white p-5 shadow-[0_12px_34px_rgba(11,36,84,.035)] print:break-inside-avoid print:border-slate-200 print:shadow-none sm:p-7 lg:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mist text-teal">
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-bold tracking-[0.12em] text-teal">{eyebrow}</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold leading-8 text-navy sm:text-xl">{title}</h2>
            {href ? <SystemLink href={href} /> : null}
          </div>
          <p className="mt-2 max-w-3xl text-[10px] leading-7 text-slate">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-5 border-t border-navy/[0.055] pt-6">
        {children}
      </div>
    </section>
  );
}

function SystemLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-cloud px-2.5 text-[8px] font-semibold text-teal transition hover:bg-mist hover:text-navy print:hidden"
    >
      فتح الشاشة
      <ExternalLink size={11} />
    </Link>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.06] bg-cloud/60 p-4">
      <span className="grid size-9 place-items-center rounded-xl bg-white text-teal shadow-sm">
        <Icon size={16} />
      </span>
      <h3 className="mt-3 text-[10px] font-bold text-navy">{title}</h3>
      <p className="mt-1.5 text-[9px] leading-5 text-slate">{description}</p>
    </article>
  );
}

function FeatureGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([title, description]) => (
        <div
          key={title}
          className="rounded-xl border border-navy/[0.06] bg-cloud/55 p-3.5"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={15} />
            <div>
              <p className="text-[10px] font-bold text-navy">{title}</p>
              <p className="mt-1 text-[9px] leading-5 text-slate">{description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-[10px] leading-6 text-slate"
        >
          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-teal" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Subheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-[11px] font-bold text-navy">
      <span className="h-4 w-1 rounded-full bg-sun" />
      {children}
    </h3>
  );
}

function StepList({
  steps,
  compact = false,
}: {
  steps: { title: string; body: string }[];
  compact?: boolean;
}) {
  return (
    <ol className={`grid gap-3 ${compact ? "sm:grid-cols-2" : ""}`}>
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex gap-3 rounded-xl border border-navy/[0.06] bg-cloud/55 p-3.5"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy font-mono text-[9px] font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-[10px] font-bold text-navy">{step.title}</p>
            <p className="mt-1 text-[9px] leading-5 text-slate">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StatusFlow({ items }: { items: [string, string][] }) {
  return (
    <div className="space-y-2">
      {items.map(([label, description], index) => (
        <div
          key={label}
          className="grid gap-2 rounded-xl border border-navy/[0.055] px-3.5 py-3 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-center"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] font-bold text-teal">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-bold text-navy">{label}</span>
          </div>
          <p className="text-[9px] leading-5 text-slate">{description}</p>
        </div>
      ))}
    </div>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "info" | "warning" | "tip";
  title: string;
  children: ReactNode;
}) {
  const config = {
    info: {
      icon: Info,
      shell: "border-sky-100 bg-sky-50/70",
      iconShell: "bg-sky-100 text-sky-700",
      title: "text-sky-950",
      body: "text-sky-900/65",
    },
    warning: {
      icon: AlertTriangle,
      shell: "border-amber-200 bg-amber-50/80",
      iconShell: "bg-amber-100 text-amber-700",
      title: "text-amber-950",
      body: "text-amber-900/70",
    },
    tip: {
      icon: Lightbulb,
      shell: "border-emerald-100 bg-emerald-50/70",
      iconShell: "bg-emerald-100 text-emerald-700",
      title: "text-emerald-950",
      body: "text-emerald-900/65",
    },
  }[tone];
  const Icon = config.icon;

  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${config.shell}`}>
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${config.iconShell}`}
      >
        <Icon size={17} />
      </span>
      <div>
        <p className={`text-[10px] font-bold ${config.title}`}>{title}</p>
        <p className={`mt-1 text-[9px] leading-6 ${config.body}`}>{children}</p>
      </div>
    </div>
  );
}

function RoleGrid() {
  const roles: [string, string, string[]][] = [
    ["مدير الأكاديمية", "وصول كامل وإدارة واعتمادات.", ["كل النظام", "الفريق والإعدادات", "الاعتمادات", "سجل التدقيق"]],
    ["مسؤول القبول", "تحويل الاهتمام إلى تسجيل.", ["CRM", "التجارب", "العروض", "حجز المقاعد"]],
    ["فريق الإدارة", "متابعة التشغيل وخدمة الأسر.", ["العملاء", "الطلاب", "التواصل", "الاشتراكات"]],
    ["المدير الأكاديمي", "جودة الدراسة والفريق التعليمي.", ["الجروبات", "المعلمون", "التقويم", "التقدم"]],
    ["مسؤول الحسابات", "التحصيل والتكاليف.", ["الفواتير", "المدفوعات", "المصروفات", "المستحقات"]],
    ["المعلم", "تنفيذ الدراسة لما هو مسند فقط.", ["حصصه", "طلابه", "الحضور", "مستحقاته"]],
    ["ولي الأمر", "متابعة الأبناء فقط.", ["الحضور", "التقدم", "الفواتير", "طلبات الخدمة"]],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {roles.map(([role, description, permissions]) => (
        <article
          key={role}
          className="rounded-2xl border border-navy/[0.06] bg-cloud/50 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-teal shadow-sm">
              <ShieldCheck size={16} />
            </span>
            <div>
              <h3 className="text-[10px] font-bold text-navy">{role}</h3>
              <p className="mt-1 text-[8px] leading-5 text-slate">{description}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-md bg-white px-2 py-1 text-[7px] font-semibold text-slate"
              >
                {permission}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function ChecklistGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-navy/[0.06] p-4">
      <h3 className="flex items-center gap-2 text-[10px] font-bold text-navy">
        <ClipboardCheck size={16} className="text-teal" />
        {title}
      </h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 rounded-lg bg-cloud/70 px-3 py-2.5"
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-teal/25 bg-white">
              <span className="size-1 rounded-full bg-teal" />
            </span>
            <p className="text-[8px] leading-5 text-slate">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DefinitionList({ items }: { items: [string, string][] }) {
  return (
    <dl className="divide-y divide-navy/[0.055] rounded-2xl border border-navy/[0.06]">
      {items.map(([term, definition]) => (
        <div
          key={term}
          className="grid gap-1 px-4 py-3.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="text-[9px] font-bold text-navy">{term}</dt>
          <dd className="text-[9px] leading-5 text-slate">{definition}</dd>
        </div>
      ))}
    </dl>
  );
}
