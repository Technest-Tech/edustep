# EduStep bounded contexts

يظل التطبيق Laravel modular monolith في المرحلة الأولى. يُنشأ كود كل مجال هنا
عندما تبدأ أول user story فعلية له، مع إبقاء HTTP controllers رفيعة.

المجالات المخططة:

1. `IdentityAccess` — المستخدمون، الأدوار، الصلاحيات، وسجل التدقيق.
2. `CRM` — العملاء المحتملون، القنوات، الأنشطة، والـfollow-ups.
3. `Admissions` — اختبارات المستوى، التجارب، والتسجيل.
4. `Academics` — البرامج، المستويات، المناهج، ومخرجات التعلم.
5. `Cohorts` — الجروبات، الجداول، الحصص، والحضور.
6. `People` — الطلاب، أولياء الأمور، والمعلمون.
7. `Finance` — الفواتير، الأقساط، المدفوعات، الاسترداد، والمصروفات.
8. `Communications` — WhatsApp والبريد والقوالب وسجل الرسائل.
9. `Reporting` — المؤشرات والـread models والتصدير.
10. `Platform` — الملفات، الإشعارات، البحث، والـintegration outbox.

لا يتعامل مجال مع جداول مجال آخر مباشرةً. الربط يتم عبر public application
services أو domain events، وتُستخدم ULIDs للمعرّفات العامة.
