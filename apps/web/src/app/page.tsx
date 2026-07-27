import Image from "next/image";
import type { Metadata } from "next";
import "./marketing.css";
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpenCheck,
  BrainCircuit,
  Check,
  ChevronDown,
  CirclePlay,
  Clock3,
  Compass,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Menu,
  MessageCircleMore,
  MonitorSmartphone,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserRoundCheck,
  UsersRound,
  Video,
} from "lucide-react";

export const metadata: Metadata = {
  metadataBase: new URL("https://edustepnow.com"),
  title: {
    absolute: "EduStep | أكاديمية إنجليزي للأطفال والكبار",
  },
  description:
    "تعلّم الإنجليزية بثقة مع EduStep: برامج تفاعلية للأطفال والناشئين والكبار، مجموعات صغيرة، تقييم مستوى مجاني، ومتابعة واضحة للتقدم.",
  applicationName: "EduStep English Academy",
  keywords: [
    "تعلم الانجليزية",
    "أكاديمية انجليزي",
    "كورس انجليزي للأطفال",
    "English courses Egypt",
    "تعليم الإنجليزية أونلاين",
    "كورس محادثة انجليزي",
    "تقييم مستوى انجليزي مجاني",
    "EduStep",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/brand/edustep-icon-final.png",
    shortcut: "/brand/edustep-icon-final.png",
    apple: "/brand/edustep-icon-final.png",
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "/",
    siteName: "EduStep English Academy",
    title: "EduStep | خطوتك للإنجليزية بثقة",
    description:
      "رحلة تعلم واضحة وممتعة: مستوى مناسب، ممارسة حقيقية، ومتابعة تخليك تشوف الفرق خطوة بخطوة.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "EduStep — الإنجليزية مش مادة، دي خطوة لمستقبل أكبر",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduStep | خطوتك للإنجليزية بثقة",
    description:
      "برامج إنجليزية تفاعلية للأطفال والناشئين والكبار مع متابعة واضحة للتقدم.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const programs = [
  {
    eyebrow: "من 6 إلى 12 سنة",
    title: "EduStep Kids",
    description:
      "تأسيس قوي ولغة حقيقية من خلال اللعب، القصص، والمواقف اليومية المناسبة لعمر طفلك.",
    icon: Gamepad2,
    accent: "sun",
    features: ["نطق ومحادثة", "قراءة وكتابة", "تعلم تفاعلي"],
  },
  {
    eyebrow: "من 13 إلى 17 سنة",
    title: "EduStep Teens",
    description:
      "برنامج يبني الثقة والطلاقة، ويدعم الدراسة والحياة بمشروعات ومحادثات عملية.",
    icon: Compass,
    accent: "teal",
    features: ["طلاقة وثقة", "مهارات أكاديمية", "مشروعات عملية"],
  },
  {
    eyebrow: "+18 سنة",
    title: "EduStep Adults",
    description:
      "إنجليزية واقعية للعمل والسفر والتواصل، بمسار واضح يناسب مستواك ووقتك.",
    icon: TrendingUp,
    accent: "navy",
    features: ["محادثة عملية", "English for work", "مرونة في المواعيد"],
  },
];

const journey = [
  {
    number: "01",
    title: "نحدد مستواك",
    description:
      "تقييم بسيط يوضح نقاط القوة وما يحتاجه المتعلم فعلًا، من غير تخمين.",
    icon: Target,
  },
  {
    number: "02",
    title: "نرسم طريقك",
    description:
      "نختار البرنامج والمستوى المناسب ونضع أهدافًا واضحة يمكن قياسها.",
    icon: Compass,
  },
  {
    number: "03",
    title: "نتعلم بالممارسة",
    description:
      "جلسات مباشرة، تفاعل مستمر، وأنشطة تجعل الإنجليزية جزءًا من الحياة.",
    icon: MessageCircleMore,
  },
  {
    number: "04",
    title: "تشوف التقدم",
    description:
      "متابعة وتقارير مبسطة توضح ما تحقق والخطوة التالية بثقة.",
    icon: Trophy,
  },
];

const promises = [
  {
    title: "مجموعات صغيرة",
    description:
      "مساحة أكبر لكل متعلم للكلام والمشاركة والحصول على ملاحظة مفيدة.",
    icon: UsersRound,
  },
  {
    title: "معلمون داعمون",
    description:
      "تعليم إنساني يشجع السؤال والمحاولة، ويحوّل الخطأ إلى خطوة للتعلم.",
    icon: UserRoundCheck,
  },
  {
    title: "محتوى يعيش معك",
    description:
      "مواقف من المدرسة والعمل والسفر والحياة، بدل الحفظ المنفصل عن الواقع.",
    icon: BrainCircuit,
  },
  {
    title: "متابعة واضحة",
    description:
      "تعرف أين وصلت، وما المهارة التي تطورت، وما الذي سنعمل عليه بعد ذلك.",
    icon: TrendingUp,
  },
  {
    title: "مرونة أونلاين",
    description:
      "تجربة مصممة من البداية لتعمل بسلاسة على الموبايل والكمبيوتر.",
    icon: MonitorSmartphone,
  },
  {
    title: "رحلة آمنة ومريحة",
    description:
      "تنظيم واضح وتواصل مستمر يطمئن الأسرة ويمنح المتعلم مساحة للنمو.",
    icon: ShieldCheck,
  },
];

const faqs = [
  {
    question: "كيف أعرف المستوى المناسب؟",
    answer:
      "نبدأ بتقييم مستوى مجاني ومحادثة قصيرة لفهم الهدف وطريقة التعلم، ثم نقترح المسار الأقرب للاحتياج الحقيقي.",
  },
  {
    question: "هل الدراسة أونلاين أم حضوري؟",
    answer:
      "تدعم EduStep تجربة تعلم أونلاين تفاعلية، وتُعرض الخيارات المتاحة عند التسجيل حسب البرنامج والمرحلة.",
  },
  {
    question: "هل البرامج مناسبة للمبتدئين تمامًا؟",
    answer:
      "نعم. المسارات تبدأ من التأسيس وتنتقل تدريجيًا، لذلك لا يحتاج المتعلم إلى خبرة سابقة للبدء.",
  },
  {
    question: "كيف أتابع تطور ابني؟",
    answer:
      "تحصل الأسرة على متابعة مبسطة حول الحضور، المهارات التي تم التدريب عليها، مستوى المشاركة، والخطوة التالية.",
  },
  {
    question: "ما الذي يميز مجموعات EduStep؟",
    answer:
      "المجموعات الصغيرة، التركيز على الممارسة، المسار الواضح، والمتابعة التي تجعل التقدم مفهومًا للمتعلم وولي الأمر.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://edustepnow.com/#organization",
      name: "EduStep English Academy",
      alternateName: "EduStep",
      url: "https://edustepnow.com/",
      logo: "https://edustepnow.com/brand/edustep-icon-final.png",
      description:
        "أكاديمية لغة إنجليزية حديثة تقدم مسارات واضحة للأطفال والناشئين والكبار مع تعلم تفاعلي ومتابعة مستمرة.",
      slogan: "خطوتك للإنجليزية بثقة",
    },
    {
      "@type": "WebSite",
      "@id": "https://edustepnow.com/#website",
      url: "https://edustepnow.com/",
      name: "EduStep English Academy",
      inLanguage: "ar-EG",
      publisher: {
        "@id": "https://edustepnow.com/#organization",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://edustepnow.com/#faq",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

export default function Home() {
  return (
    <div className="academy-marketing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mobile-scroll-progress" aria-hidden="true">
        <span />
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a className="brand-link" href="#top" aria-label="EduStep — الرئيسية">
            <Image
              src="/brand/edustep-logo-final.webp"
              alt="EduStep English Academy"
              width={1670}
              height={542}
              priority
            />
          </a>

          <nav className="desktop-nav" aria-label="التنقل الرئيسي">
            <a href="#programs">البرامج</a>
            <a href="#journey">رحلة التعلم</a>
            <a href="#why">لماذا EduStep؟</a>
            <a href="#progress">متابعة التقدم</a>
            <a href="#faq">الأسئلة الشائعة</a>
          </nav>

          <div className="header-actions">
            <a
              className="portal-link"
              href="/login"
              aria-label="دخول منصة EduStep"
            >
              دخول المنصة
              <ArrowUpLeft size={15} aria-hidden="true" />
            </a>
            <a className="button button-small button-primary" href="#start">
              ابدأ من هنا
              <ArrowLeft size={17} aria-hidden="true" />
            </a>
          </div>

          <details className="mobile-menu">
            <summary aria-label="فتح القائمة">
              <Menu size={22} aria-hidden="true" />
              <span>استكشف</span>
            </summary>
            <nav className="mobile-menu-panel" aria-label="التنقل على الهاتف">
              <div className="mobile-menu-intro">
                <strong>اختر خطوتك</strong>
                <span>رحلة تعلّم واضحة تبدأ من هنا</span>
              </div>
              <a href="#programs">البرامج</a>
              <a href="#journey">رحلة التعلم</a>
              <a href="#why">لماذا EduStep؟</a>
              <a href="#progress">متابعة التقدم</a>
              <a href="#faq">الأسئلة الشائعة</a>
              <a href="/login">دخول المنصة</a>
              <a className="button button-primary" href="#start">
                ابدأ من هنا
                <ArrowLeft size={17} aria-hidden="true" />
              </a>
            </nav>
          </details>
        </div>
      </header>

      <main id="top">
        <section className="hero section-shell">
          <div className="hero-glow hero-glow-one" aria-hidden="true" />
          <div className="hero-glow hero-glow-two" aria-hidden="true" />

          <div className="container hero-grid">
            <div className="hero-copy" data-reveal>
              <div className="eyebrow">
                <span className="eyebrow-icon">
                  <Sparkles size={15} aria-hidden="true" />
                </span>
                أكاديمية إنجليزية تُظهر التقدم
              </div>

              <h1>
                الإنجليزية مش مادة…
                <span>دي خطوة لمستقبل أكبر.</span>
              </h1>

              <p className="hero-lead">
                في EduStep بنحوّل التعلّم لرحلة واضحة وممتعة: مستوى مناسب،
                ممارسة حقيقية، ومتابعة تخليك تشوف الفرق خطوة بخطوة.
              </p>

              <div className="hero-actions">
                <a className="button button-primary button-large" href="#start">
                  احجز تقييم المستوى مجانًا
                  <ArrowLeft size={20} aria-hidden="true" />
                </a>
                <a className="button button-ghost button-large" href="#journey">
                  <CirclePlay size={20} aria-hidden="true" />
                  شوف رحلة التعلّم
                </a>
              </div>

              <div className="hero-proof" aria-label="مزايا EduStep">
                <span>
                  <Check size={15} aria-hidden="true" />
                  تقييم مجاني
                </span>
                <span>
                  <Check size={15} aria-hidden="true" />
                  مجموعات صغيرة
                </span>
                <span>
                  <Check size={15} aria-hidden="true" />
                  متابعة مستمرة
                </span>
              </div>
            </div>

            <div
              className="hero-visual"
              aria-label="تعلم إنجليزي تفاعلي مع EduStep"
              data-reveal
            >
              <div className="visual-orbit orbit-one" aria-hidden="true" />
              <div className="visual-orbit orbit-two" aria-hidden="true" />

              <div className="hero-photo-frame">
                <Image
                  src="/media/hero-family.png"
                  alt="أم تساعد ابنها أثناء تجربة تعلم رقمية"
                  fill
                  priority
                  sizes="(max-width: 900px) 92vw, 44vw"
                />
                <div className="hero-photo-shade" aria-hidden="true" />
                <div className="photo-label">
                  <span className="live-dot" />
                  تعلم مباشر وتفاعلي
                </div>
              </div>

              <div className="floating-card progress-float">
                <div className="float-icon">
                  <TrendingUp size={19} aria-hidden="true" />
                </div>
                <div>
                  <strong>تقدم واضح</strong>
                  <span>كل خطوة محسوبة</span>
                </div>
                <div className="mini-chart" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="floating-card practice-float">
                <div className="avatars" aria-hidden="true">
                  <span>Hi</span>
                  <span>Go</span>
                  <span>A+</span>
                </div>
                <div>
                  <strong>مساحة للكلام</strong>
                  <span>مش للحفظ وبس</span>
                </div>
              </div>

              <div className="achievement-spark" aria-hidden="true">
                <Star size={22} fill="currentColor" />
              </div>

              <div className="mobile-hero-meter" aria-hidden="true">
                <div>
                  <span>رحلتك تبدأ بخطوة</span>
                  <strong>تقييم ← خطة ← ممارسة</strong>
                </div>
                <div className="meter-ring">
                  <span>3</span>
                  خطوات
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="أساس تجربة EduStep">
          <div className="container trust-grid">
            <div>
              <Video size={22} aria-hidden="true" />
              <span>
                <strong>جلسات مباشرة</strong>
                تفاعل حقيقي
              </span>
            </div>
            <div>
              <UsersRound size={22} aria-hidden="true" />
              <span>
                <strong>مجموعات صغيرة</strong>
                مشاركة أكبر
              </span>
            </div>
            <div>
              <BookOpenCheck size={22} aria-hidden="true" />
              <span>
                <strong>مستويات واضحة</strong>
                طريق مفهوم
              </span>
            </div>
            <div>
              <HeartHandshake size={22} aria-hidden="true" />
              <span>
                <strong>متابعة إنسانية</strong>
                دعم مستمر
              </span>
            </div>
          </div>
        </section>

        <section className="section section-programs" id="programs">
          <div className="container">
            <div className="section-heading centered" data-reveal>
              <span className="section-kicker">برنامج لكل مرحلة</span>
              <h2>
                كل عمر له <em>خطوته المناسبة</em>
              </h2>
              <p>
                نفس الجودة والاهتمام، بمحتوى وأهداف وطريقة تعلم تناسب المرحلة
                فعلًا.
              </p>
            </div>

            <div className="mobile-swipe-hint" aria-hidden="true">
              اسحب لاختيار البرنامج
            </div>

            <div className="program-grid">
              {programs.map((program) => {
                const Icon = program.icon;
                return (
                  <article
                    className={`program-card program-${program.accent}`}
                    key={program.title}
                    data-reveal
                  >
                    <div className="program-top">
                      <div className="program-icon">
                        <Icon size={27} aria-hidden="true" />
                      </div>
                      <span>{program.eyebrow}</span>
                    </div>
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                    <ul>
                      {program.features.map((feature) => (
                        <li key={feature}>
                          <Check size={15} aria-hidden="true" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <a href="#start" aria-label={`اعرف أكثر عن ${program.title}`}>
                      اعرف المسار المناسب
                      <ArrowLeft size={17} aria-hidden="true" />
                    </a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section section-journey" id="journey">
          <div className="container">
            <div className="journey-header">
              <div className="section-heading" data-reveal>
                <span className="section-kicker light">رحلة بسيطة وواضحة</span>
                <h2>
                  من أول تقييم…
                  <em> لحد ما تتكلم بثقة</em>
                </h2>
              </div>
              <p>
                لا نترك التقدم للصدفة. كل مرحلة لها هدف، وكل هدف له دليل واضح
                يساعد المتعلم والأسرة على معرفة الخطوة التالية.
              </p>
            </div>

            <div className="journey-grid">
              {journey.map((step) => {
                const Icon = step.icon;
                return (
                  <article className="journey-step" key={step.number} data-reveal>
                    <div className="journey-number">{step.number}</div>
                    <div className="journey-icon">
                      <Icon size={23} aria-hidden="true" />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section kids-feature">
          <div className="container">
            <div className="kids-banner" data-reveal>
              <Image
                src="/media/kids-journey.png"
                alt="مجموعة أطفال سعداء في رحلة تعلم الإنجليزية"
                fill
                sizes="(max-width: 900px) 94vw, 1180px"
              />
              <div className="kids-banner-overlay" aria-hidden="true" />
              <div className="kids-banner-copy">
                <span>
                  <Sparkles size={15} aria-hidden="true" />
                  التعلّم اللي يتحب
                </span>
                <h2>نجرّب. نشارك. نتكلم بثقة.</h2>
                <p>
                  لما المتعلم يكون جزءًا من التجربة، الإنجليزية تتحول من واجب
                  ثقيل إلى مساحة اكتشاف.
                </p>
                <a className="button button-sun" href="#why">
                  اكتشف تجربة EduStep
                  <ArrowLeft size={18} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-why" id="why">
          <div className="container">
            <div className="why-layout">
              <div className="section-heading why-heading" data-reveal>
                <span className="section-kicker">مصممة حول المتعلم</span>
                <h2>
                  تجربة مريحة للأسرة…
                  <em> ومشجعة للمتعلم</em>
                </h2>
                <p>
                  التفاصيل الصغيرة هي اللي تصنع الفرق: وقت للكلام، أهداف
                  مفهومة، تواصل واضح، وتقنية تساعد بدل ما تعقّد.
                </p>
                <div className="why-note">
                  <div>
                    <MousePointerClick size={22} aria-hidden="true" />
                  </div>
                  <span>
                    <strong>Arabic-first experience</strong>
                    كل شيء واضح ومريح من الموبايل.
                  </span>
                </div>
              </div>

              <div className="promise-grid">
                {promises.map((promise) => {
                  const Icon = promise.icon;
                  return (
                    <article className="promise-card" key={promise.title} data-reveal>
                      <div className="promise-icon">
                        <Icon size={22} aria-hidden="true" />
                      </div>
                      <div>
                        <h3>{promise.title}</h3>
                        <p>{promise.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="section section-progress" id="progress">
          <div className="container progress-layout">
            <div className="progress-copy section-heading" data-reveal>
              <span className="section-kicker light">التقدم اللي تقدر تشوفه</span>
              <h2>
                مش بس حضر الحصة…
                <em> اعرف إيه اللي اتغير</em>
              </h2>
              <p>
                متابعة مبسطة تحول رحلة التعلم إلى صورة مفهومة: المهارات،
                المشاركة، الالتزام، وما يحتاجه المتعلم في الخطوة القادمة.
              </p>
              <ul className="check-list">
                <li>
                  <span>
                    <Check size={15} aria-hidden="true" />
                  </span>
                  متابعة الحضور والمشاركة
                </li>
                <li>
                  <span>
                    <Check size={15} aria-hidden="true" />
                  </span>
                  قياس المهارات بدون تعقيد
                </li>
                <li>
                  <span>
                    <Check size={15} aria-hidden="true" />
                  </span>
                  توصية واضحة للخطوة التالية
                </li>
              </ul>
            </div>

            <div
              className="progress-dashboard"
              aria-label="مثال توضيحي لمتابعة تقدم الطالب"
              data-reveal
            >
              <div className="dashboard-topbar">
                <div className="student-chip">
                  <span className="student-avatar">م</span>
                  <div>
                    <strong>رحلة محمد</strong>
                    <span>Kids · Step 03</span>
                  </div>
                </div>
                <span className="status-chip">يتقدم بثبات</span>
              </div>

              <div className="level-card">
                <div className="level-meta">
                  <span>تقدم المستوى الحالي</span>
                  <strong>خطوة 3 من 5</strong>
                </div>
                <div className="level-track" aria-hidden="true">
                  <span />
                </div>
                <div className="milestones" aria-hidden="true">
                  <i className="done">1</i>
                  <i className="done">2</i>
                  <i className="current">3</i>
                  <i>4</i>
                  <i>5</i>
                </div>
              </div>

              <div className="skill-grid">
                <div className="skill-card">
                  <div className="skill-ring ring-strong">
                    <span>قوي</span>
                  </div>
                  <strong>المحادثة</strong>
                  <small>مشاركة أفضل</small>
                </div>
                <div className="skill-card">
                  <div className="skill-ring ring-growing">
                    <span>ينمو</span>
                  </div>
                  <strong>الاستماع</strong>
                  <small>تقدم مستمر</small>
                </div>
                <div className="skill-card">
                  <div className="skill-ring ring-focus">
                    <span>تركيز</span>
                  </div>
                  <strong>الكتابة</strong>
                  <small>الخطوة القادمة</small>
                </div>
              </div>

              <div className="teacher-note">
                <div className="note-icon">
                  <Sparkles size={17} aria-hidden="true" />
                </div>
                <div>
                  <span>ملاحظة هذا الأسبوع</span>
                  <strong>
                    ثقة أكبر في تكوين الجمل والمشاركة بدون تردد.
                  </strong>
                </div>
              </div>

              <p className="illustration-label">تصور توضيحي لتجربة المتابعة</p>
            </div>
          </div>
        </section>

        <section className="section guide-section">
          <div className="container guide-layout">
            <div className="guide-portrait" data-reveal>
              <div className="portrait-backdrop" aria-hidden="true" />
              <Image
                src="/media/learning-guide.png"
                alt="مرشدة تعليم من فريق EduStep"
                width={941}
                height={1672}
                sizes="(max-width: 760px) 80vw, 420px"
              />
              <div className="guide-badge">
                <HeartHandshake size={20} aria-hidden="true" />
                <span>
                  <strong>دعم إنساني</strong>
                  معك في كل خطوة
                </span>
              </div>
            </div>

            <div className="guide-copy section-heading" data-reveal>
              <span className="section-kicker">التقنية تنظم… والإنسان يعلّم</span>
              <h2>
                في كل خطوة،
                <em> فيه حد فاهمك وبيشجعك</em>
              </h2>
              <p>
                المنصة تسهّل الجدول والمتابعة والتقارير، لكن جوهر EduStep هو
                العلاقة: معلم يسمع، يشجع، ويعرف متى يحتاج المتعلم تحديًا أو
                دعمًا إضافيًا.
              </p>
              <div className="guide-points">
                <div>
                  <span>
                    <Clock3 size={18} aria-hidden="true" />
                  </span>
                  <strong>وقت الحصة للتعلّم</strong>
                  <small>تنظيم واضح يقلل التشتت</small>
                </div>
                <div>
                  <span>
                    <Laptop size={18} aria-hidden="true" />
                  </span>
                  <strong>تجربة رقمية سهلة</strong>
                  <small>من أي جهاز وبخطوات بسيطة</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-faq" id="faq">
          <div className="container faq-layout">
            <div className="section-heading faq-heading" data-reveal>
              <span className="section-kicker">قبل ما تبدأ</span>
              <h2>
                أسئلة شائعة،
                <em> وإجابات واضحة</em>
              </h2>
              <p>
                لو سؤالك مش موجود هنا، فريق EduStep هيكون معك لاختيار الخطوة
                الأنسب.
              </p>
            </div>

            <div className="faq-list">
              {faqs.map((item, index) => (
                <details key={item.question} open={index === 0} data-reveal>
                  <summary>
                    {item.question}
                    <span>
                      <ChevronDown size={19} aria-hidden="true" />
                    </span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta" id="start">
          <div className="cta-glow" aria-hidden="true" />
          <div className="container cta-inner" data-reveal>
            <div className="cta-icon" aria-hidden="true">
              <GraduationCap size={28} />
            </div>
            <div>
              <span className="cta-kicker">خطوة صغيرة النهارده، فرق كبير بكرة</span>
              <h2>جاهز تبدأ رحلتك مع الإنجليزية بثقة؟</h2>
              <p>
                اكتشف البرنامج المناسب، ثم ابدأ بتقييم مستوى مجاني يوضح لك
                الطريق من أول خطوة.
              </p>
            </div>
            <div className="cta-actions">
              <a className="button button-sun button-large" href="#programs">
                اختَر برنامجك
                <ArrowLeft size={20} aria-hidden="true" />
              </a>
              <a
                className="button button-outline-light button-large"
                href="/login"
              >
                دخول المنصة
                <ArrowUpLeft size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <nav className="mobile-dock" aria-label="اختصارات الهاتف">
        <a href="#top" data-dock-target="top" className="is-active">
          <GraduationCap size={19} aria-hidden="true" />
          <span>الرئيسية</span>
        </a>
        <a href="#programs" data-dock-target="programs">
          <BookOpenCheck size={19} aria-hidden="true" />
          <span>البرامج</span>
        </a>
        <a className="dock-primary" href="#start" data-dock-target="start">
          <Target size={20} aria-hidden="true" />
          <span>تقييم مجاني</span>
        </a>
        <a href="#progress" data-dock-target="progress">
          <TrendingUp size={19} aria-hidden="true" />
          <span>تقدمك</span>
        </a>
      </nav>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <Image
              src="/brand/edustep-logo-final.webp"
              alt="EduStep English Academy"
              width={1670}
              height={542}
            />
            <p>
              أكاديمية إنجليزية حديثة تجعل التعلّم رحلة واضحة، مشجعة، وقابلة
              للقياس.
            </p>
          </div>
          <div className="footer-links">
            <strong>استكشف</strong>
            <a href="#programs">البرامج</a>
            <a href="#journey">رحلة التعلم</a>
            <a href="#progress">متابعة التقدم</a>
          </div>
          <div className="footer-links">
            <strong>EduStep</strong>
            <a href="#why">لماذا نحن؟</a>
            <a href="#faq">الأسئلة الشائعة</a>
            <a href="/login">دخول المنصة</a>
          </div>
          <div className="footer-domain">
            <span>الموقع الرسمي</span>
            <strong>EduStepNow.com</strong>
            <p>Learn. Grow. Step Forward.</p>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} EduStep English Academy</p>
          <p>خطوتك للإنجليزية بثقة</p>
        </div>
      </footer>

      <script src="/mobile-experience.js" defer />
    </div>
  );
}
