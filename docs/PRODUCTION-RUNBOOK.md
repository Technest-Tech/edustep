# EduStep Production Runbook

هذا الدليل هو مرجع تشغيل النسخة الحقيقية للأكاديمية. ينفَّذ من جذر المشروع،
وتُستبدل `academy.example.com` بالنطاق الفعلي.

## نشر Contabo الحالي

النشر المعتمد لـ`edustepnow.com` على السيرفر المشترك يعمل كالتالي:

- Nginx الموجود على الـhost يظل المالك الوحيد للمنافذ العامة 80 و443.
- حاويات EduStep تُنشر على `127.0.0.1:8081` فقط.
- ملف الـvhost المستقل هو
  `infra/nginx/host-edustepnow.com.conf`، ولا تُعدّل ملفات Academiq الموجودة.
- شهادة `edustepnow.com` مستقلة عن شهادة `acadmyq.com`.
- PostgreSQL وRedis الخاصان بـEduStep داخل شبكة Docker الخاصة ولا يُكشفان
  على الـhost أو الإنترنت.
- استخدم system user ومجلدًا وأسماء خدمات مستقلة، وأضف swap قبل تشغيل stack
  ثانٍ على السيرفر.

## 1. بوابات السماح بالإطلاق

لا يبدأ إدخال بيانات حقيقية قبل اكتمال كل البنود التالية:

- نطاق HTTPS فعلي وشهادة TLS صالحة. ملف Nginx داخل المشروع يستقبل HTTP خلف
  بوابة TLS أو load balancer، ولا يجب كشفه مباشرة للإنترنت.
- تعبئة جميع القيم التي تبدأ بـ`REPLACE_WITH_` وتوليد `APP_KEY` فريد.
- PostgreSQL وRedis غير متاحين من الإنترنت؛ ملف الإنتاج يبقيهما على شبكة
  داخلية فقط.
- مزود SMTP حقيقي مجرَّب. رسائل WhatsApp/SMS الخارجية تظل في قائمة انتظار
  صادقة حتى ربط مزود رسمي؛ لا تعتبرها مُرسلة قبل ذلك.
- إنشاء أول مدير، تسجيل دخوله، وتفعيل التحقق بخطوتين وحفظ رموز الاسترداد
  خارج الجهاز.
- نجاح نسخة احتياطية موثقة، ونسخها إلى مخزن خارجي مشفّر. Docker volume وحده
  ليس disaster recovery.
- ظهور `ready: true` من `/api/v1/readiness`.
- نجاح اختبارات الـAPI وlint/build للواجهة على نفس نسخة الكود المراد نشرها.

## 2. تجهيز الأسرار

```bash
cp infra/production.env.example infra/production.env
cd apps/api
php artisan key:generate --show
cd ../..
```

انسخ المفتاح الناتج إلى `APP_KEY` ثم حدّث داخل
  `infra/production.env`:

- `APP_URL`, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`.
- `APP_TIMEZONE=Africa/Cairo` حتى تعمل الجداول والنسخ اليومية بتوقيت الأكاديمية.
- أبقِ `HTTP_PORT=127.0.0.1:8081` على سيرفر Contabo المشترك. لا تربطه
  بـ`0.0.0.0` لأن firewall غير مفعّل.
- كلمات مرور PostgreSQL وRedis بقيم طويلة وعشوائية ومختلفة.
- إعدادات SMTP.
- `APP_VERSION` برقم إصدار لا يتكرر.
- `TRUSTED_PROXIES` بعناوين الـproxy الفعلية متى كانت معروفة. لا تترك `*`
  إذا أمكن الوصول المباشر إلى الحاوية.

تحقق أن الملف لن يدخل Git:

```bash
git check-ignore infra/production.env
docker compose --env-file infra/production.env -f compose.production.yaml config --quiet
```

## 3. أول إطلاق

ابنِ الصور ثم شغّل قاعدة البيانات والخدمات:

```bash
docker compose --env-file infra/production.env -f compose.production.yaml build --pull
docker compose --env-file infra/production.env -f compose.production.yaml up -d
docker compose --env-file infra/production.env -f compose.production.yaml ps
```

خدمة `migrate` تطبّق migrations بقفل معزول قبل السماح للـAPI بالعمل. لا تشغّل
seed بيانات التطوير.

أنشئ أول مدير في جلسة طرفية خاصة. كلمة المرور لا تظهر على الشاشة ولا توضع في
history:

```bash
docker compose --env-file infra/production.env -f compose.production.yaml run --rm api \
  php artisan academy:bootstrap-owner \
  --name="Academy Owner" \
  --email="owner@academy.example.com"
```

الأمر يرفض إنشاء مدير أول جديد إذا كان هناك مدير بالفعل. بعد ذلك:

1. سجّل الدخول بالحساب الجديد.
2. أكمل التحقق بخطوتين الإلزامي.
3. خزّن رموز الاسترداد في password manager مؤسسي أو خزنة آمنة.
4. أنشئ الموظفين من مركز الإدارة؛ سيُطلب منهم تغيير كلمة المرور المؤقتة.

أنشئ أول نسخة موثقة. خلال دقيقة يسجل الـscheduler والـqueue نبضهما:

```bash
docker compose --env-file infra/production.env -f compose.production.yaml exec api \
  php artisan academy:backup --verify
docker compose --env-file infra/production.env -f compose.production.yaml exec api \
  php artisan operations:check
curl --fail --silent https://academy.example.com/api/v1/readiness
```

## 4. نشر إصدار جديد

قبل أي migration على قاعدة موجودة، أنشئ نسخة باستخدام صورة التطبيق الجديدة
ولكن قبل تنفيذ خدمة migration:

```bash
docker compose --env-file infra/production.env -f compose.production.yaml build --pull
docker compose --env-file infra/production.env -f compose.production.yaml up -d postgres redis
docker compose --env-file infra/production.env -f compose.production.yaml run --rm --no-deps migrate \
  php artisan academy:backup --verify
docker compose --env-file infra/production.env -f compose.production.yaml up -d
```

ثم افحص:

```bash
docker compose --env-file infra/production.env -f compose.production.yaml ps
docker compose --env-file infra/production.env -f compose.production.yaml exec api \
  php artisan operations:check
curl --fail --silent https://academy.example.com/api/v1/health
curl --fail --silent https://academy.example.com/api/v1/readiness
```

`health` يثبت أن العملية حية. `readiness` لا ينجح إلا إذا كانت قاعدة البيانات
والـcache والتخزين والـscheduler والـqueue وآخر backup المطلوبين بحالة سليمة.

## 5. النسخ الاحتياطي

الـscheduler ينفذ يوميًا الساعة 02:00:

- snapshot متسق لقاعدة البيانات.
- SHA-256 داخل manifest مستقل.
- فحص بنية أرشيف PostgreSQL عبر `pg_restore --list`.
- الاحتفاظ الافتراضي 30 يومًا.

تشغيل يدوي أو إعادة فحص آخر نسخة:

```bash
docker compose --env-file infra/production.env -f compose.production.yaml exec api \
  php artisan academy:backup --verify
docker compose --env-file infra/production.env -f compose.production.yaml exec api \
  php artisan academy:backup:verify
```

ملفات النسخ موجودة داخل volume باسم `backup_data`. يجب مزامنتها يوميًا إلى
object storage أو مخزن خارجي مشفّر بسياسة وصول منفصلة، مع تنبيه عند فشل
المزامنة. اختبر تنزيل نسخة من المخزن الخارجي واستعادتها مرة كل شهر.

## 6. تدريب الاستعادة

لا تختبر الاستعادة فوق قاعدة الإنتاج. استخدم قاعدة مؤقتة:

1. اختر archive تم تنزيله من المخزن الخارجي وافحص الـmanifest.
2. أنشئ قاعدة مؤقتة باسم مؤرخ.
3. استعد الأرشيف إليها.
4. شغّل فحصًا وظيفيًا على نسخة تطبيق معزولة.
5. احذف قاعدة التدريب بعد توثيق النتيجة.

مثال داخل نفس بيئة Docker، مع استبدال اسم الملف:

```bash
docker compose --env-file infra/production.env -f compose.production.yaml run --rm --no-deps migrate \
  php artisan academy:backup:verify /var/backups/edustep/edustep-pgsql-YYYYMMDD_HHMMSS-xxxxxx.dump
docker compose --env-file infra/production.env -f compose.production.yaml exec postgres \
  sh -lc 'createdb -U "$POSTGRES_USER" edustep_restore_test'
docker compose --env-file infra/production.env -f compose.production.yaml run --rm --no-deps migrate \
  sh -lc 'PGPASSWORD="$DB_PASSWORD" pg_restore --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USERNAME" --dbname=edustep_restore_test --no-owner --no-privileges /var/backups/edustep/edustep-pgsql-YYYYMMDD_HHMMSS-xxxxxx.dump'
```

الاستعادة الفعلية للإنتاج تغيير مادي عالي الخطورة: فعّل maintenance window،
خذ snapshot إضافيًا، أوقف `queue` و`scheduler`، واستعد إلى قاعدة جديدة ثم غيّر
الاتصال إليها بعد التحقق. لا تستخدم `--clean` على قاعدة الإنتاج مباشرة.

## 7. المراقبة اليومية

- راقب HTTP status لـ`/api/v1/readiness` كل دقيقة من خارج الخادم.
- نبّه على أي 5xx وعلى بطء الطلبات فوق `SLOW_REQUEST_THRESHOLD_MS`.
- راقب امتلاء الأقراص، PostgreSQL، Redis، حجم queue، وفشل jobs.
- راجع آخر `verified_at` للنسخ الاحتياطية يوميًا.
- راجع سجل التدقيق لمحاولات إدارة الفريق، كلمات المرور، و2FA.
- أدر كلمات مرور الخدمات وأسرار SMTP دوريًا وعند مغادرة أي مسؤول.

## 8. rollback

إذا فشل الإصدار:

1. أوقف استقبال التغييرات أو فعّل maintenance window.
2. احتفظ بسجلات الإصدار الفاشل ولا تحذف volumes.
3. إذا لم تغيّر migration البيانات بصورة غير متوافقة، أعد تشغيل صورة
   `APP_VERSION` السابقة.
4. إذا غيّرت البيانات، استعد إلى قاعدة جديدة من النسخة الموثقة السابقة ثم
   وجّه التطبيق إليها.
5. لا تعتبر rollback ناجحًا حتى ينجح `operations:check` و`readiness` وتجربة
   تسجيل الدخول وتسجيل عملية مالية تجريبية معتمدة.
