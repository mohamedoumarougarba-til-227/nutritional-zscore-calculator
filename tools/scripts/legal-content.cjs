'use strict';
// Public business details supplied by the owner; no patient data belongs here.
const publisher = {
    name: 'Tout Informatique Lazaret (TIL)', director: 'Mohamed OUMAROU GARBA',
    rccm: 'NE-NIM-01-2023-A10-01440', nif: '102382/P',
    address: 'Rue LZ-102 de Nord Lazaret - Gao Magobri, BP 12825 Niamey (Niger)',
    phones: '+227 80 14 50 80 / +227 88 41 49 94 / +227 93 36 45 66',
    email: 'contact@tilbadge.com', website: 'https://toutinformatiquelazaret.vercel.app/',
    verifiedOn: '2026-10-20', identitySource: 'https://www.tilbadge.com/legal'
};
const content = {
    fr: {
        title: 'Informations légales et confidentialité', back: 'Retour à Z-score', updated: 'Mise à jour : 20 octobre 2026',
        intro: 'Z-score Niger est édité par Tout Informatique Lazaret. Cette page décrit le fonctionnement de cette application et les droits liés à son utilisation.',
        sections: [
            ['legal', 'Mentions légales', [
                'Éditeur : {name}. Directeur de publication : {director}. RCCM : {rccm} ; NIF : {nif}. Adresse professionnelle : {address}. Téléphones : {phones}. Contact : {email}.',
                'Hébergement prévu : Vercel Inc. pour la distribution des fichiers de l’application par HTTPS. Les dossiers saisis sont conservés dans votre navigateur ; aucune base de dossiers patients n’est hébergée par cette application sur Vercel.',
                'La marque Z-score Niger et l’identité de TIL ne constituent aucune affiliation, approbation ou certification par l’OMS ou l’UNICEF. Les droits des ressources tierces restent applicables.'
            ]],
            ['privacy', 'Confidentialité et données personnelles', [
                'Les données saisies peuvent comprendre un identifiant de dossier, un nom ou pseudonyme facultatif, le sexe, l’âge ou la date de naissance, la date de mesure, le poids, la taille, la position de mesure, les œdèmes constatés, le périmètre brachial et les observations cliniques facultatives, ainsi que les résultats calculés. Elles servent aux calculs, aux visites, aux lots et à leur sauvegarde locale.',
                'Les calculs, imports, graphiques et exports sont effectués sur cet appareil. L’application ne transmet pas les mesures ni les dossiers à TIL, à l’OMS ou à un service de synchronisation. Un autre appareil ou une autre adresse du site ne retrouve pas automatiquement vos dossiers : exportez puis importez une sauvegarde pour les transférer.',
                'Le professionnel ou l’établissement qui saisit les données détermine les finalités et les conditions de leur utilisation : information des personnes concernées, fondement juridique approprié, autorisations applicables aux données de santé et aux mineurs, durée de conservation et habilitations. Le stockage local ne dispense pas de ces obligations.',
                'TIL gère les éventuelles demandes adressées au contact public. N’envoyez pas de dossiers médicaux ou de captures identifiantes au support. L’hébergeur peut traiter des données techniques de connexion (adresse IP, requêtes, informations du navigateur) pour servir et sécuriser le site, selon sa politique. Ces données techniques se distinguent des mesures conservées localement et peuvent être traitées hors du Niger par l’infrastructure de l’hébergeur.',
                'Les dossiers restent dans le profil de ce navigateur jusqu’à leur suppression ou à l’effacement du stockage. Le navigateur peut aussi les perdre ou les évincer. Les exports téléchargés restent sur le support choisi jusqu’à leur suppression. Conservez seulement les données nécessaires et appliquez la durée prévue par votre établissement.',
                'Pour accéder, rectifier ou demander l’effacement d’un dossier, contactez d’abord le professionnel ou l’établissement qui le conserve. TIL n’a pas d’accès à distance à votre stockage local. Pour une question sur le service ou une demande concernant un échange avec TIL, écrivez à {email}. Le cadre nigérien comprend la loi n° 2022-59 du 16 décembre 2022, telle que modifiée. La HAPDP est l’autorité de protection des données au Niger ; ses textes officiels sont liés ci-dessous.'
            ]],
            ['cookies', 'Cookies et stockage sur cet appareil', [
                'Cette version n’intègre aucun outil de publicité, de suivi marketing ou de mesure d’audience et ne crée pas de cookie applicatif. Elle utilise le stockage du navigateur pour ses fonctions demandées par l’utilisateur.',
                'localStorage mémorise la langue, l’apparence, les préférences et les journaux de reprise. IndexedDB conserve les dossiers, visites, résultats, versions et imports préparés. Cache Storage et le service worker conservent les fichiers de l’application pour l’usage hors ligne. Ce cache contient les ressources de l’outil ; les dossiers sont gérés séparément dans le stockage local.',
                'Vous pouvez gérer ces données dans les paramètres du navigateur. Leur effacement peut supprimer les dossiers et empêcher le fonctionnement hors ligne : exportez d’abord une sauvegarde si vous devez les conserver. Le refus ou le blocage du stockage peut limiter la sauvegarde et le mode hors ligne.',
                'Les éventuels mécanismes de sécurité de l’hébergeur sont distincts des fonctions de l’application. L’ajout ultérieur d’un traceur ou d’un service externe nécessitera une mise à jour de cette information et, lorsque requis, un choix préalable de l’utilisateur.'
            ]],
            ['terms', 'Conditions d’utilisation', [
                'L’accès actuel est gratuit et sans compte. L’outil calcule des indicateurs anthropométriques à partir des données saisies et des références indiquées. Les champs, unités, limites d’âge et plages propres à chaque indicateur doivent être respectés ; aucune extrapolation hors référence ne doit être déduite d’un résultat absent.',
                'Un Z-score ou une classification ne constitue pas, à lui seul, un diagnostic ni une prescription. L’évaluation de l’enfant, les signes cliniques, l’orientation et le traitement relèvent du professionnel et des protocoles applicables. L’outil ne décide pas d’une admission et ne prescrit pas de médicament ou de ration.',
                'Vérifiez l’identité du dossier, le sexe, les dates, les unités et la position de mesure avant utilisation des résultats. Les résultats repris d’une sauvegarde conservent leur référence et leur date d’origine ; l’import ne certifie pas leur contenu médical. Les statistiques de lot décrivent les lignes enregistrées et ne valent pas estimation représentative d’une population.',
                'Protégez l’appareil et son profil de navigateur. Les personnes partageant ce profil peuvent accéder aux dossiers. Le stockage local, les PDF, les CSV et les sauvegardes ordinaires ne sont pas chiffrés par l’application. L’option de sauvegarde chiffrée protège le fichier exporté par AES-256-GCM, avec une phrase secrète choisie par l’utilisateur et non conservée. Sans cette phrase, aucune récupération n’est possible. HTTPS protège le transport des fichiers du site. Privilégiez un identifiant ou un pseudonyme et protégez les supports de sauvegarde.',
                'La sauvegarde automatique reste locale. Exportez régulièrement une copie complète sur un support protégé et vérifiez sa reprise. Une panne, un changement d’adresse, un effacement du navigateur ou une perte d’appareil peut rendre les données indisponibles. La disponibilité continue du site et la conservation par le navigateur ne sont pas garanties.',
                'Ces informations et l’usage du service relèvent du droit nigérien, sous réserve des dispositions impératives applicables. En cas de difficulté, contactez TIL pour rechercher une solution amiable avant de saisir la juridiction compétente. Aucune clause ne supprime un droit ou une responsabilité que la loi rend obligatoire.'
            ]],
            ['sources', 'Sources, attributions et licences', [
                'Le code original de Z-score Niger est distribué sous GNU GPL version 3, sur décision de Tout Informatique Lazaret. Vous pouvez l’utiliser, l’étudier, le modifier et le redistribuer, y compris commercialement, en respectant cette licence. L’archive téléchargeable ci-dessous fournit les sources de la version diffusée et les instructions de reconstruction. Ces droits logiciels ne portent pas sur les dossiers des enfants ni sur les sauvegardes privées.',
                'Références de croissance : standards OMS 2006 pour les moins de 5 ans et référence OMS 2007 pour les âges admis par chaque indicateur. Ces références de calcul sont distinctes des recommandations de prise en charge nutritionnelle et des protocoles nationaux.',
                'Les tables LMS sont converties des dépôts officiels WHO Anthro (GPL version 3) et AnthroPlus (GPL version 3 ou ultérieure). Les tables converties, leurs manifestes et les empreintes des sources figurent dans le paquet. Les notices complètes et les sources officielles sont accessibles ci-dessous.',
                'Les rapports utilisent jsPDF 4.2.1 et AutoTable 5.0.8 sous licence MIT, et les polices Amiri sous SIL Open Font License 1.1. Leurs auteurs et notices sont conservés. Les licences du logiciel n’accordent aucun droit sur les dossiers des enfants ni sur les marques tierces.'
            ]]
        ], links: 'Documents et sources', contact: 'Contact professionnel'
    },
    en: {
        title: 'Legal information and privacy', back: 'Back to Z-score', updated: 'Updated: 20 October 2026',
        intro: 'Z-score Niger is published by Tout Informatique Lazaret. This page explains how this application works and the rights associated with its use.',
        sections: [
            ['legal', 'Legal notice', [
                'Publisher: {name}. Publication director: {director}. RCCM: {rccm}; NIF: {nif}. Business address: {address}. Telephone: {phones}. Contact: {email}.',
                'Planned hosting: Vercel Inc. distributes the application files over HTTPS. Entered records stay in your browser; this application hosts no patient-record database on Vercel.',
                'Z-score Niger and TIL are not affiliated with, endorsed or certified by WHO or UNICEF. Third-party resource rights continue to apply.'
            ]],
            ['privacy', 'Privacy and personal data', [
                'Entered data may include a record identifier, optional name or pseudonym, sex, age or birth date, measurement date, weight, height, measurement position, observed oedema, optional MUAC and clinical observations, and calculated results. They support calculations, visits, batches and local saving.',
                'Calculations, imports, charts and exports run on this device. The application does not send measurements or records to TIL, WHO or a synchronisation service. A different device or site address does not automatically recover them: export and import a backup to transfer them.',
                'The professional or institution entering records determines their purposes and conditions of use, including informing people, a suitable legal basis, requirements for health data and minors, retention periods and access permissions. Local storage does not remove these obligations.',
                'TIL handles requests sent to its public contact. Do not send medical records or identifiable screenshots to support. The hosting provider may process technical connection data (IP address, requests and browser information) to deliver and secure the site under its privacy policy. These technical data are separate from locally stored measurements and may be processed outside Niger by the hosting infrastructure.',
                'Records remain in this browser profile until deleted or its storage is cleared. The browser may also lose or evict them. Downloaded exports remain on the chosen medium until deleted. Keep only necessary data and apply your institution’s retention period.',
                'For access, correction or erasure of a record, contact the professional or institution holding it first. TIL cannot access your local storage remotely. For service questions or requests about correspondence with TIL, contact {email}. Niger’s legal framework includes Law No. 2022-59 of 16 December 2022, as amended. HAPDP is the data protection authority; official legislation is linked below.'
            ]],
            ['cookies', 'Cookies and storage on this device', [
                'This version includes no advertising, marketing tracking or audience analytics and sets no application cookie. It uses browser storage for functions requested by the user.',
                'localStorage stores language, appearance, preferences and recovery journals. IndexedDB stores records, visits, results, versions and prepared imports. Cache Storage and the service worker store application files for offline use. This cache contains tool resources; records are managed separately in local storage.',
                'You can manage these data in browser settings. Clearing them can delete records and prevent offline use: export a backup first if you need to retain them. Blocking storage can limit saving and offline operation.',
                'Any hosting security mechanisms are separate from application functions. Adding a tracker or external service later will require updated information and, where required, a prior user choice.'
            ]],
            ['terms', 'Terms of use', [
                'Access is currently free and requires no account. The tool calculates anthropometric indicators from entered data and the stated references. Observe field units, age limits and each indicator’s ranges; an unavailable result must not be interpreted by extrapolating outside the reference.',
                'A Z-score or classification alone is neither a diagnosis nor a prescription. Assessing the child, clinical signs, referral and treatment remain the professional’s responsibility under applicable protocols. The tool makes no admission decision and prescribes no medicine or ration.',
                'Check record identity, sex, dates, units and measurement position before using results. Restored results retain their original reference and date; import does not certify medical content. Batch statistics describe saved rows and are not representative population estimates.',
                'Protect the device and browser profile. People sharing that profile can access records. Local storage, PDF, CSV and ordinary backups are not encrypted by the application. The encrypted backup option protects the exported file with AES-256-GCM using a user-chosen passphrase that is not retained. Recovery without that passphrase is not possible. HTTPS protects transport of site files. Prefer an identifier or pseudonym and protect backup media.',
                'Automatic saving stays local. Regularly export a full copy to protected storage and check that it can be restored. Device failure, an address change, cleared browser storage or a lost device may make data unavailable. Continuous site availability and browser retention are not guaranteed.',
                'This information and service use are governed by Nigerien law, subject to applicable mandatory provisions. Contact TIL to seek an amicable solution before referring a dispute to the competent court. No clause removes a right or liability that is mandatory by law.'
            ]],
            ['sources', 'Sources, credits and licences', [
                'The original Z-score Niger code is distributed under GNU GPL version 3 by decision of Tout Informatique Lazaret. You may use, study, modify and redistribute it, including commercially, under that licence. The download below provides the corresponding sources of the distributed version and build instructions. These software rights do not apply to children’s records or private backups.',
                'Growth references: WHO 2006 standards for children under 5 and the WHO 2007 reference for ages covered by each indicator. Calculation references are separate from nutrition care recommendations and national protocols.',
                'LMS tables are converted from the official WHO Anthro (GPL version 3) and AnthroPlus (GPL version 3 or later) repositories. Converted tables, manifests and source hashes are in the package. Full notices and official sources are linked below.',
                'Reports use jsPDF 4.2.1 and AutoTable 5.0.8 under the MIT licence, and Amiri fonts under SIL Open Font License 1.1. Authors and notices are retained. Software licences grant no rights over children’s records or third-party trademarks.'
            ]]
        ], links: 'Documents and sources', contact: 'Business contact'
    },
    ar: {
        title: 'المعلومات القانونية والخصوصية', back: 'العودة إلى Z-score', updated: 'آخر تحديث: 20 أكتوبر 2026',
        intro: 'تنشر شركة Tout Informatique Lazaret تطبيق Z-score Niger. توضح هذه الصفحة طريقة عمل التطبيق والحقوق المرتبطة باستخدامه.',
        sections: [
            ['legal', 'الإشعار القانوني', [
                'الناشر: {name}. مدير النشر: {director}. السجل التجاري RCCM: {rccm}؛ الرقم الضريبي NIF: {nif}. العنوان المهني: {address}. الهاتف: {phones}. التواصل: {email}.',
                'الاستضافة المقررة: Vercel Inc. لتوزيع ملفات التطبيق عبر HTTPS. تبقى السجلات المدخلة في متصفحك؛ ولا يستضيف هذا التطبيق قاعدة بيانات لملفات المرضى على Vercel.',
                'لا تعني تسمية Z-score Niger أو هوية TIL وجود انتساب أو اعتماد أو تصديق من منظمة الصحة العالمية أو اليونيسف. تبقى حقوق موارد الجهات الأخرى سارية.'
            ]],
            ['privacy', 'الخصوصية والبيانات الشخصية', [
                'قد تشمل البيانات معرف الملف والاسم أو الاسم المستعار الاختياري والجنس والعمر أو تاريخ الميلاد وتاريخ القياس والوزن والطول ووضعية القياس والوذمة الملحوظة والنتائج المحسوبة. تستخدم للحسابات والزيارات والمجموعات والحفظ المحلي.',
                'تجري الحسابات والاستيراد والرسوم والتصدير على هذا الجهاز. لا يرسل التطبيق القياسات أو الملفات إلى TIL أو منظمة الصحة العالمية أو خدمة مزامنة. لا يسترجع جهاز آخر أو عنوان آخر للموقع الملفات تلقائياً؛ يتطلب نقلها تصدير نسخة احتياطية ثم استيرادها.',
                'يحدد المهني أو المؤسسة التي تدخل البيانات أغراض استخدامها وشروطه، بما يشمل إبلاغ الأشخاص والأساس القانوني المناسب ومتطلبات البيانات الصحية والقاصرين ومدد الاحتفاظ وصلاحيات الوصول. لا يلغي التخزين المحلي هذه الالتزامات.',
                'تتعامل TIL مع الطلبات المرسلة إلى جهة الاتصال العامة. لا ترسل ملفات طبية أو صور شاشة تكشف الهوية إلى الدعم. قد يعالج المستضيف بيانات الاتصال التقنية، مثل عنوان IP والطلبات ومعلومات المتصفح، لتقديم الموقع وحمايته وفق سياسة الخصوصية الخاصة به. وهي منفصلة عن القياسات المخزنة محلياً وقد تعالجها بنية الاستضافة خارج النيجر.',
                'تبقى الملفات في ملف تعريف المتصفح حتى حذفها أو مسح التخزين. وقد يفقدها المتصفح أو يزيلها. تبقى الصادرات على الوسيط المختار حتى حذفها. احتفظ فقط بالبيانات اللازمة وطبق مدة الاحتفاظ التي تحددها مؤسستك.',
                'لطلب الاطلاع على ملف أو تصحيحه أو محوه، تواصل أولاً مع المهني أو المؤسسة التي تحتفظ به. لا تستطيع TIL الوصول عن بعد إلى التخزين المحلي. للاستفسارات عن الخدمة أو المراسلات مع TIL: {email}. يشمل الإطار القانوني القانون رقم 2022-59 المؤرخ في 16 ديسمبر 2022 وتعديلاته. الهيئة HAPDP هي سلطة حماية البيانات في النيجر، وروابط النصوص الرسمية أدناه.'
            ]],
            ['cookies', 'ملفات الارتباط والتخزين على الجهاز', [
                'لا تتضمن هذه النسخة إعلانات أو تتبعاً تسويقياً أو تحليلات للجمهور، ولا تنشئ ملفات ارتباط خاصة بالتطبيق. تستخدم تخزين المتصفح للوظائف التي يطلبها المستخدم.',
                'يحفظ localStorage اللغة والمظهر والتفضيلات وسجلات الاستعادة. وتحفظ IndexedDB الملفات والزيارات والنتائج والنسخ والاستيرادات المعدة. وتحفظ Cache Storage وعامل الخدمة ملفات التطبيق للاستخدام دون اتصال. تحتوي الذاكرة المؤقتة على موارد الأداة؛ وتدار الملفات بشكل منفصل في التخزين المحلي.',
                'يمكن إدارة هذه البيانات من إعدادات المتصفح. قد يؤدي مسحها إلى حذف الملفات وتعطيل العمل دون اتصال؛ صدّر نسخة احتياطية أولاً إذا أردت الاحتفاظ بها. وقد يحد حظر التخزين من الحفظ والعمل دون اتصال.',
                'آليات أمان المستضيف، إن وجدت، منفصلة عن وظائف التطبيق. تتطلب إضافة متتبع أو خدمة خارجية لاحقاً تحديث هذه المعلومات والحصول على اختيار مسبق للمستخدم عندما يكون ذلك مطلوباً.'
            ]],
            ['terms', 'شروط الاستخدام', [
                'الوصول مجاني حالياً ولا يتطلب حساباً. تحسب الأداة المؤشرات الأنثروبومترية من البيانات المدخلة والمراجع المحددة. يجب احترام الوحدات وحدود العمر ونطاق كل مؤشر؛ ولا يجوز استنتاج نتيجة غير متاحة بالاستقراء خارج المرجع.',
                'درجة Z أو التصنيف وحدهما ليسا تشخيصاً أو وصفة علاجية. يبقى تقييم الطفل والعلامات السريرية والإحالة والعلاج مسؤولية المهني وفق البروتوكولات المعمول بها. لا تقرر الأداة القبول ولا تصف دواءً أو حصة غذائية.',
                'تحقق من هوية الملف والجنس والتواريخ والوحدات ووضعية القياس قبل استخدام النتائج. تحتفظ النتائج المستعادة بمرجعها وتاريخها الأصليين؛ ولا يصادق الاستيراد على محتواها الطبي. تصف إحصاءات المجموعة الصفوف المحفوظة ولا تمثل تقديراً سكانياً ممثلاً.',
                'احم الجهاز وملف تعريف المتصفح. يمكن لمن يشاركون هذا الملف الوصول إلى السجلات. لا يشفر التطبيق التخزين المحلي وPDF وCSV والنسخ العادية. يحمي خيار النسخة المشفرة الملف المصدر بتشفير AES-256-GCM وعبارة سرية يختارها المستخدم ولا تحفظ. لا يمكن الاستعادة دون العبارة. تحمي HTTPS نقل ملفات الموقع. استخدم معرفاً أو اسماً مستعاراً واحم وسائط النسخ.',
                'يبقى الحفظ التلقائي محلياً. صدّر بانتظام نسخة كاملة إلى وسيط محمي وتحقق من استعادتها. قد يمنع العطل أو تغيير عنوان الموقع أو مسح المتصفح أو فقدان الجهاز الوصول إلى البيانات. لا يتوفر ضمان لاستمرار الموقع أو احتفاظ المتصفح بالبيانات.',
                'تخضع هذه المعلومات واستخدام الخدمة لقانون النيجر مع مراعاة الأحكام الإلزامية المعمول بها. تواصل مع TIL للبحث عن تسوية ودية قبل اللجوء إلى المحكمة المختصة. لا يلغي أي شرط حقاً أو مسؤولية يفرضهما القانون.'
            ]],
            ['sources', 'المصادر والإسناد والتراخيص', [
                'يوزع الكود الأصلي لتطبيق Z-score Niger بموجب GNU GPL الإصدار 3 بقرار من Tout Informatique Lazaret. يجوز استخدامه ودراسته وتعديله وإعادة توزيعه، بما في ذلك تجارياً، مع احترام الترخيص. يوفر الأرشيف أدناه مصادر النسخة الموزعة وتعليمات بنائها. لا تشمل هذه الحقوق البرمجية ملفات الأطفال أو النسخ الاحتياطية الخاصة.',
                'مراجع النمو: معايير منظمة الصحة العالمية 2006 للأطفال دون الخامسة ومرجع 2007 للأعمار التي يغطيها كل مؤشر. تختلف مراجع الحساب عن توصيات الرعاية التغذوية والبروتوكولات الوطنية.',
                'حوّلت جداول LMS من مستودعي WHO Anthro الرسمي بترخيص GPL الإصدار 3 وAnthroPlus بترخيص GPL الإصدار 3 أو أحدث. تتضمن الحزمة الجداول المحولة وبياناتها الوصفية وبصمات المصادر. الروابط أدناه توفر الإشعارات الكاملة والمصادر الرسمية.',
                'تستخدم التقارير jsPDF 4.2.1 وAutoTable 5.0.8 بترخيص MIT وخطوط Amiri بترخيص SIL Open Font License 1.1 مع حفظ أسماء المؤلفين والإشعارات. لا تمنح تراخيص البرمجيات حقوقاً على ملفات الأطفال أو العلامات التجارية للغير.'
            ]]
        ], links: 'الوثائق والمصادر', contact: 'التواصل المهني'
    }
};
module.exports = { publisher, content };
