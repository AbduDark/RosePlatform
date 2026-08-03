<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Laravel CORS Configuration
    |--------------------------------------------------------------------------
    |
    | هنا بتحدد إعدادات Cross-Origin Resource Sharing (CORS)
    | علشان تتحكم في من يقدر يبعت Requests للـ API بتاعك
    |
    | ملحوظة مهمة: paths زي storage/* و uploads/* موجودة هنا، بس لو الـ
    | Nginx بتاعك بيسيرف الملفات دي مباشرة كـ static files (زي ما هو
    | الحال في الإعداد الحالي)، الـ requests دي أصلاً معدياش على
    | Laravel/PHP، يعني الإعداد هنا مش هيتطبق عليها فعليًا. لازم تحط
    | CORS headers على مستوى الـ Nginx نفسه لنفس الـ location (الحل
    | موجود في ملف nginx المرفق).
    |
    */

    'paths' => [],

    // الطرق المسموحة (GET, POST, PUT, DELETE ...)
    'allowed_methods' => ['*'],

    // الـ domains المسموح لها تبعت requests
    'allowed_origins' => [
        'https://rose-academy.com',
        'https://www.rose-academy.com',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
        'http://localhost',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1',
    ],

    // لو عايز تعمل regex بدل ما تكتب الـ origins صريحة
    'allowed_origins_patterns' => [],

    // الهيدرز المسموح بيها
    'allowed_headers' => ['*'],

    // الهيدرز اللي ممكن تظهر للـ Frontend (زوّد هنا أي هيدر مخصص محتاج
    // تقراه من الـ JS، مثلاً Content-Disposition لو بتنزّل ملفات)
    'exposed_headers' => [],

    // المدة اللي المتصفح ممكن يكاش فيها preflight request (OPTIONS) - 24 ساعة
    'max_age' => 86400,

    // لو الـ frontend بيبعت cookies أو Authorization header
    'supports_credentials' => true,

];