<?php

namespace App\Support;

class RoleCatalog
{
    /**
     * @return array<string, array{label: string, description: string, permissions: array<int, string>}>
     */
    public static function all(): array
    {
        return [
            'owner' => [
                'label' => 'مدير الأكاديمية',
                'description' => 'وصول كامل وإدارة الفريق والإعدادات والاعتمادات.',
                'permissions' => ['كامل النظام', 'إدارة المستخدمين', 'الاعتمادات المالية', 'سجل التدقيق'],
            ],
            'staff' => [
                'label' => 'فريق الإدارة',
                'description' => 'تشغيل العملاء والطلاب والتواصل والاشتراكات.',
                'permissions' => ['العملاء', 'القبول', 'الطلاب', 'التواصل', 'الاشتراكات'],
            ],
            'admissions' => [
                'label' => 'مسؤول القبول',
                'description' => 'إدارة العملاء والتجارب والعروض والتحويل.',
                'permissions' => ['CRM', 'التجارب', 'العروض', 'حجز المقاعد', 'خدمة الأسر'],
            ],
            'academic_manager' => [
                'label' => 'المدير الأكاديمي',
                'description' => 'إدارة المعلمين والجروبات والمستويات والتقدم.',
                'permissions' => ['الجروبات', 'المعلمون', 'التقويم', 'التقدم', 'التقارير'],
            ],
            'accountant' => [
                'label' => 'مسؤول الحسابات',
                'description' => 'التحصيل والفواتير والمصروفات والرواتب.',
                'permissions' => ['الفواتير', 'المدفوعات', 'المصروفات', 'الرواتب', 'التقارير المالية'],
            ],
            'teacher' => [
                'label' => 'معلم',
                'description' => 'الوصول للجروبات والطلاب والحصص المسندة فقط.',
                'permissions' => ['حصصه', 'طلابه', 'الحضور', 'التقدم', 'مستحقاته'],
            ],
            'guardian' => [
                'label' => 'ولي أمر',
                'description' => 'بوابة الأسرة والبيانات المرتبطة بالأبناء فقط.',
                'permissions' => ['الأبناء', 'الحضور', 'التقدم', 'الفواتير', 'طلبات الخدمة'],
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_keys(self::all());
    }

    /**
     * @return array<int, string>
     */
    public static function staffKeys(): array
    {
        return ['owner', 'staff', 'admissions', 'academic_manager', 'accountant'];
    }
}
