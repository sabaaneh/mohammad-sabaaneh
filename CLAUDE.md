# موقع محمد سباعنة — دليل المشروع

موقع ثابت (HTML/CSS/JS بدون framework) للفنان الفلسطيني محمد سباعنة.
الدومين: `sabaaneh.com` (ملف `CNAME`، GitHub Pages، DNS على GoDaddy).
الريبو: `https://github.com/sabaaneh/mohammad-sabaaneh.git` (نُقل من حساب `7mz410` في 2026-09-28).
سجل `www` في GoDaddy يجب أن يشير إلى `sabaaneh.github.io` (كان `7mz410.github.io`).

## هيكل المجلدات

```
Sabaaneh web/              ← المصادر الأصلية (خارج git، ~2GB)
├── Cartoon/<سنة>/          كاريكاتير 2017–2025
├── Mural /<اسم>/           جداريات (انتبه: مسافة بعد "Mural " وبعض المجلدات الفرعية)
├── prints/<مجموعة>/        مطبوعات: Intaglio, white and black, Kooz, Digital, Big prints, Natives
├── Books/<كتاب>/           أغلفة + Pages/ (صفحات من الكتاب)
├── Bio/                    Bio.txt/Bio.docx + صورة شخصية
├── Hero.png, signiture.jpg, Logo-White.png, fav.png
├── Sabaaneh Portfolio.pdf, sabaaneh high.pdf
├── website notes.txt       طلبات العميل (بالعربي)
└── website/                ← الموقع نفسه (git repo)
    ├── index.html          مكتوب يدوياً (hero, facts, about, video, portfolio)
    ├── generate_pages.js   يولّد باقي الصفحات
    ├── compress_missing.js يحوّل الصور الأصلية إلى webp
    ├── main.js             animations, menu, تبويبات السنوات, lightbox
    ├── style.css
    ├── content/
    │   ├── books/<slug>.html  نص كل كتاب (HTML جزئي)
    │   ├── buy-links.json     روابط الشراء لكل طبعة
    │   ├── reviews.json       ريفيوهات الكتب: اقتباس + رابط + لقطة شاشة في public/assets/Reviews/
    │   ├── awards.json        جوائز كل كتاب (نفس الصيغة)
    │   ├── map.json           خريطة العالم بالرئيسية: الدولة ← [خط الطول، العرض] + الأنشطة
    │   └── press.json         صفحة news.html: أقسام News وInterviews (نفس الصيغة، `lang: "ar"` للنص العربي)
    └── public/assets/      الصور المضغوطة (webp) بنفس هيكل المصادر
```

## الصفحات

| الصفحة | المصدر |
|---|---|
| `index.html` | يدوي. الـ NAV والـ FOOTER بين تعليقات `<!-- NAV -->` و`<!-- FOOTER -->` يستبدلها السكربت |
| `cartoons.html` | مولّد من `public/assets/Cartoon/<سنة>` — تبويب لكل سنة، `#2019` في الرابط يفتح السنة |
| `murals.html` | مولّد من `public/assets/Mural/<اسم>` (ما عدا Ink) — الترتيب في `ORDER` داخل `generateMurals` |
| `ink-murals.html` | مولّد من `public/assets/Mural/Ink` — `generateInkMurals` |
| `books.html` + `book-<slug>.html` | مولّد. بيانات الكتب في ثابت `BOOKS` + `content/` |
| `prints.html` | مولّد من `public/assets/prints/<مجموعة>` — Digital دائماً آخراً، زر تحميل `Sabaaneh_High.pdf` |
| `news.html` | مولّد من `content/press.json` |
| `art.html` | مولّد من `public/assets/Art` (المصدر `../Art/`، يضغطه `compress_missing.js`) |
| `404.html` | مولّد |

**لا تعدّل الصفحات المولّدة يدوياً** — التعديل يضيع عند التشغيل التالي. عدّل `generate_pages.js` أو `content/`.

## الأوامر

```bash
cd website
npm install          # مرة واحدة (sharp)
npm run images       # compress_missing.js: يضغط الصور الجديدة فقط (يتخطى الموجود)
npm run pages        # generate_pages.js: يعيد توليد كل الصفحات
npx serve .          # معاينة محلية (أو أي static server)
```

## مهام شائعة

- **إضافة صور كاريكاتير/جدارية/مطبوعة:** ضع الأصل في المجلد المناسب خارج `website/` ← `npm run images` ← `npm run pages`.
  - `compress_missing.js` يغطي: Hero، Ink، الكتب، الكاريكاتير (السنوات مكتوبة يدوياً في مصفوفة `years`)، PDFs، التوقيع.
  - لا يغطي باقي الجداريات ولا prints — `compress.js` (عام، 1200px) أو `compress_kooz.js` (tif لـ Kooz) للحالات القديمة. أو أضف `processDir` في `compress_missing.js`.
  - سنة جديدة للكاريكاتير: أضفها لمصفوفة `years` في `compress_missing.js`، وحدّث `2017 – 2024` في `generateCartoons`.
- **كتاب جديد:** أضف مدخلاً في `BOOKS` (اسم المجلد ← [العنوان، العنوان الفرعي، ملف الغلاف الإنجليزي])، وفي مصفوفة `books` بـ `compress_missing.js`، ونص في `content/books/<slug>.html`، وروابط في `buy-links.json`.
  - الـ slug يُشتق من اسم المجلد: `Power Born of Dream` ← `power-born-of-dream`.
- **ريفيو/جائزة/خبر/مقابلة جديدة:** أضف مدخلاً في `content/reviews.json` أو `awards.json` أو `press.json` تحت اسم مجلد الكتاب، وضع لقطة الشاشة (webp، عرض 800) في `public/assets/Reviews/` ← `npm run pages`.
- **خريطة العالم (آخر قسم بالرئيسية):** عدّل `content/map.json` ← `npm run pages`. الـ SVG يُبنى وقت التوليد (d3-geo + world-atlas، devDependencies) ويُحقن بين `<!-- MAP -->` و`<!-- /MAP -->`. اسم الدولة لازم يطابق `world-atlas` (مثلاً `United States of America`).
- **فيديو:** مضمّن كـ YouTube iframe. الرئيسية في `index.html`، جدارية Home وكتاب Power Born داخل `generate_pages.js`.
- **روابط التواصل/الإيميل:** ثابت `SOCIAL` و`NAV`/`FOOTER` في `generate_pages.js` ثم `npm run pages` (يحدّث `index.html` أيضاً).
- **جدارية عريضة (panorama):** نسبة > 2.5 تأخذ class `wide` تلقائياً وتمتد بعرض الشبكة.

## ملاحظات

- الصور: عرض أقصى 1400px (`compress_missing.js`)، webp جودة 80.
- `Sabaaneh_High.pdf` في المستودع نسخة مضغوطة (حد 25MB) — السكربت لا يستبدلها إن وُجدت.
- `git status` قد يظهر مئات الملفات "modified" بسبب تغيير الصلاحيات فقط. الحل: `git config core.fileMode false`.
- الخطوط: Oswald + Source Serif 4 (Google Fonts). الأيقونات: Font Awesome 6.5.1.
- مصدر السيرة الذاتية: `../Bio/Bio.txt` — قسم About في `index.html`.

## متبقٍ من `website notes.txt`

- كتاب Welcome to Hell بلا نص في `content/books/`.
- التحقق من غلافَي 30 Seconds from Gaza وWhite and Black بالإنجليزي.
- فرق بين المصادر والموقع: `Books/Power Born of Dream /Pages` فيها 4 ملفات والموقع 3؛ `prints/Digital` 10 مقابل 9.
