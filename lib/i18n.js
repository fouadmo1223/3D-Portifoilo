// Shared by server and client. UI strings live here; content strings live in MongoDB as { en, ar }.
export const LOCALES = ['en', 'ar']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_COOKIE = 'p3d_lang'

export const isLocale = (v) => LOCALES.includes(v)
export const dirOf = (locale) => (locale === 'ar' ? 'rtl' : 'ltr')

// Pick the right language from a { en, ar } field, falling back to English.
export function pick(field, locale) {
  if (field == null) return ''
  if (typeof field === 'string') return field
  return (locale === 'ar' ? field.ar : field.en) || field.en || field.ar || ''
}
export function pickList(field, locale) {
  if (!field) return []
  const list = locale === 'ar' ? field.ar : field.en
  return list?.length ? list : field.en || []
}

export const dictionaries = {
  en: {
    nav: { work: 'Work', about: 'About', expertise: 'Expertise', experience: 'Experience', lab: 'Lab', contact: 'Contact', classic: 'Classic portfolio' },
    hero: {
      explore: 'Explore my work',
      room: 'Drag to look around · scroll to enter',
      talk: "Let's talk",
      scroll: 'Scroll',
      available: 'Available for new projects',
      unavailable: 'Currently booked',
    },
    about: { label: 'About', philosophy: 'How I work', education: 'Education', based: 'Based in', principles: [
      ['Craft over noise', 'Every animation earns its place. If motion does not explain, guide or delight, it goes.'],
      ['Performance is a feature', 'Lazy scenes, adaptive quality and clean teardown — the experience stays smooth on a mid-range phone.'],
      ['Ship the whole thing', 'From Mongo schema to shader, I build the full product, not just the screenshot.'],
    ] },
    expertise: {
      label: 'Expertise',
      title: 'A full stack, tuned for motion.',
      hint: 'Drag the ring · hover a discipline',
      groups: {
        frontend: ['Interfaces', 'Component systems, accessible UI and pixel-precise layouts.'],
        backend: ['Systems', 'APIs, data models, auth and the plumbing that keeps products honest.'],
        creative: ['Motion & 3D', 'WebGL scenes, scroll choreography and interaction design.'],
        tools: ['Tooling', 'The workshop: version control, containers, build tools.'],
        soft: ['Working style', 'How I collaborate with teams and clients.'],
      },
    },
    work: {
      label: 'Selected work',
      title: 'Things I have built',
      hint: 'Scroll to move through the reel',
      view: 'View case',
      live: 'Live site',
      code: 'Source',
      archive: 'Archive',
      archiveTitle: 'All projects',
      filter: 'Filter by stack',
      all: 'All',
      index: 'Index',
      project: 'Project',
      stack: 'Stack',
      year: 'Year',
      empty: 'No projects in this category yet.',
    },
    project: { back: 'Back to work', overview: 'Overview', features: 'Highlights', gallery: 'Gallery', next: 'Next project', role: 'Category', tech: 'Technologies' },
    experience: { label: 'Experience', title: 'Where I have worked', present: 'Present' },
    lab: { label: 'Creative lab', title: 'Experiments & play', hint: 'These run live in your browser', open: 'Open demo', interact: 'Interact' },
    contact: {
      label: 'Contact',
      title: "Let's build something remarkable.",
      copy: 'Copy email',
      copied: 'Copied',
      elsewhere: 'Elsewhere',
      letter: {
        dear: 'Hi Fouad,',
        name: 'my name is',
        namePh: 'your name',
        about: "and I'd like to talk about",
        aboutPh: 'a project, a role, an idea…',
        reach: 'You can reach me at',
        emailPh: 'you@email.com',
        detailsPh: 'A few details — goals, timeline, links…',
        send: 'Send message',
        sending: 'Sending…',
        sent: 'Thank you — your message is on its way. I usually reply within a day.',
        another: 'Send another',
      },
    },
    footer: { local: 'Local time', top: 'Back to top', rights: 'Designed & built by' },
    chat: { drag: 'Drag to move · Shift + arrows also work',
      open: 'Ask my AI',
      title: 'Ask about my work',
      intro: "Hi! I'm Fouad's AI representative. Ask me about projects, skills or experience.",
      placeholder: 'Type a question…',
      send: 'Send',
      error: 'The assistant is unavailable right now. Please try again shortly.',
      suggestions: ['What have you built with Three.js?', 'Show me your e-commerce work', 'What is your experience?'],
    },
    a11y: { skip: 'Skip to content', menu: 'Menu', close: 'Close', language: 'العربية', sound: 'Toggle motion' },
    loader: 'Loading experience',
  },
  ar: {
    nav: { work: 'الأعمال', about: 'نبذة', expertise: 'الخبرات', experience: 'المسيرة', lab: 'المختبر', contact: 'تواصل', classic: 'النسخة الكلاسيكية' },
    hero: {
      explore: 'استكشف أعمالي',
      room: 'اسحب للتجول · مرّر للدخول',
      talk: 'لنتحدث',
      scroll: 'مرّر',
      available: 'متاح لمشاريع جديدة',
      unavailable: 'مشغول حاليًا',
    },
    about: { label: 'نبذة', philosophy: 'طريقتي في العمل', education: 'التعليم', based: 'المقر', principles: [
      ['الإتقان قبل الضجيج', 'كل حركة لها سبب. إن لم تشرح أو توجّه أو تُبهج، فلا مكان لها.'],
      ['الأداء ميزة', 'مشاهد تُحمّل عند الحاجة وجودة تتكيّف مع الجهاز، لتبقى التجربة سلسة حتى على الهواتف المتوسطة.'],
      ['أبني المنتج كاملًا', 'من مخطط قاعدة البيانات حتى الـ shader، أبني المنتج بالكامل وليس مجرد واجهة.'],
    ] },
    expertise: {
      label: 'الخبرات',
      title: 'تطوير متكامل بلمسة حركة.',
      hint: 'اسحب الحلقة · مرّر على أي مجال',
      groups: {
        frontend: ['الواجهات', 'أنظمة مكوّنات وواجهات سهلة الوصول وتصاميم دقيقة.'],
        backend: ['الأنظمة', 'واجهات برمجية ونماذج بيانات ومصادقة وكل ما يجعل المنتج يعمل.'],
        creative: ['الحركة والـ 3D', 'مشاهد WebGL وتنسيق الحركة مع التمرير وتصميم التفاعل.'],
        tools: ['الأدوات', 'ورشة العمل: إدارة الإصدارات والحاويات وأدوات البناء.'],
        soft: ['أسلوب العمل', 'طريقتي في التعاون مع الفرق والعملاء.'],
      },
    },
    work: {
      label: 'أعمال مختارة',
      title: 'أشياء قمت ببنائها',
      hint: 'مرّر للتنقل بين الأعمال',
      view: 'عرض المشروع',
      live: 'الموقع',
      code: 'الكود',
      archive: 'الأرشيف',
      archiveTitle: 'كل الأعمال',
      filter: 'تصفية حسب التقنية',
      all: 'الكل',
      index: 'رقم',
      project: 'المشروع',
      stack: 'التقنيات',
      year: 'السنة',
      empty: 'لا توجد مشاريع في هذا التصنيف بعد.',
    },
    project: { back: 'العودة للأعمال', overview: 'نظرة عامة', features: 'أبرز المزايا', gallery: 'معرض الصور', next: 'المشروع التالي', role: 'التصنيف', tech: 'التقنيات' },
    experience: { label: 'المسيرة', title: 'أين عملت', present: 'حتى الآن' },
    lab: { label: 'المختبر الإبداعي', title: 'تجارب ولعب', hint: 'تعمل مباشرة في متصفحك', open: 'فتح العرض', interact: 'جرّب' },
    contact: {
      label: 'تواصل',
      title: 'لنصنع شيئًا استثنائيًا.',
      copy: 'نسخ البريد',
      copied: 'تم النسخ',
      elsewhere: 'روابط أخرى',
      letter: {
        dear: 'أهلًا فؤاد،',
        name: 'اسمي',
        namePh: 'اسمك',
        about: 'وأود التحدث معك بخصوص',
        aboutPh: 'مشروع، وظيفة، فكرة…',
        reach: 'يمكنك التواصل معي على',
        emailPh: 'you@email.com',
        detailsPh: 'بعض التفاصيل — الأهداف، الجدول الزمني، الروابط…',
        send: 'إرسال الرسالة',
        sending: 'جارٍ الإرسال…',
        sent: 'شكرًا لك — وصلت رسالتك، وعادةً أرد خلال يوم.',
        another: 'إرسال رسالة أخرى',
      },
    },
    footer: { local: 'التوقيت المحلي', top: 'للأعلى', rights: 'تصميم وتطوير' },
    chat: { drag: 'اسحب للتحريك',
      open: 'اسأل مساعدي',
      title: 'اسأل عن أعمالي',
      intro: 'أهلًا! أنا المساعد الذكي لفؤاد. اسألني عن المشاريع أو المهارات أو الخبرة.',
      placeholder: 'اكتب سؤالك…',
      send: 'إرسال',
      error: 'المساعد غير متاح حاليًا. حاول مرة أخرى بعد قليل.',
      suggestions: ['ما الذي بنيته باستخدام Three.js؟', 'أرني مشاريع المتاجر الإلكترونية', 'ما هي خبراتك؟'],
    },
    a11y: { skip: 'انتقل للمحتوى', menu: 'القائمة', close: 'إغلاق', language: 'English', sound: 'تبديل الحركة' },
    loader: 'جارٍ تحميل التجربة',
  },
}

export const getDictionary = (locale) => dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE]
