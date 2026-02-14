const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/sahaba.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const translations = {
    // Descriptions (Short)
    "abu-bakr-enhanced": { descriptionArabic: "أول الخلفاء الراشدين وأقرب أصحاب النبي. ساند النبي في الهجرة ووحد الأمة الإسلامية." },
    "umar-enhanced": { descriptionArabic: "الخليفة الثاني، عُرف بعدله وقوته. في عهده انتشر الإسلام في بقاع واسعة." },
    "uthman-enhanced": {
        descriptionArabic: "الخليفة الثالث، عُرف بكرمه وحيائه. جمع القرآن في مصحف واحد محفوظ.",
        longBiographyArabic: "<p><strong>عثمان بن عفان</strong> (ذو النورين) هو ثالث الخلفاء الراشدين، وأحد العشرة المبشرين بالجنة. عُرف بحيائه الشديد وكرمه اللامتناهي. تزوج من ابنتي النبي ﷺ رقية ثم أم كلثوم، ولذلك لُقب بذي النورين. كان غنياً كريماً، جهز جيش العسرة من ماله الخاص واشترى بئر رومة للمسلمين. في عهده، جُمع القرآن الكريم في مصحف واحد (المصحف العثماني) لتوحيد قراءة المسلمين، وهو أعظم إنجازاته. امتدت الفتوحات الإسلامية في عهده لتشمل أرمينيا والقوقاز وخراسان وكرمان وسجستان وإفريقية وقبرص. استشهد في داره وهو يقرأ القرآن، صابراً محتسباً، لتكون دماؤه شاهدة على المصحف الذي بين يديه.</p>"
    },
    "ali-enhanced": {
        descriptionArabic: "الخليفة الرابع، عُرف بشجاعته وحكمته. كان ابن عم النبي وصهره، ومن أوائل من أسلموا.",
        longBiographyArabic: "<p><strong>علي بن أبي طالب</strong> هو رابع الخلفاء الراشدين، وابن عم النبي ﷺ وصهره، وزوج سيدة نساء العالمين فاطمة الزهراء. كان أول من أسلم من الصبيان. اشتهر بشجاعته الفائقة، حيث نام في فراش النبي ليلة الهجرة ليفديه بنفسه، وكان بطلاً مغواراً في جميع الغزوات، خاصة في خيبر حيث فتح الحصن بيده. كما عُرف بعلمه الغزير وحكمته البالغة، فكان مرجعاً للصحابة في القضاء والفتوى، حتى قال عمر: 'لولا علي لهلك عمر'. تميزت خلافته بالزهد والعدل، وكان يعيش حياة بسيطة رغم اتساع الدولة. استشهد في الكوفة على يد أحد الخوارج وهو خارج لصلاة الفجر.</p>"
    },
    "khalid-enhanced": {
        descriptionArabic: "سيف الله المسلول، القائد العسكري الذي لم يهزم قط. قاد جيوش المسلمين في فتوحات عظيمة.",
        longBiographyArabic: "<p><strong>خالد بن الوليد</strong>، الملقب بـ <strong>سيف الله المسلول</strong>، هو أحد أعظم القادة العسكريين في التاريخ. لم يهزم في أكثر من مائة معركة خاضها، سواء قبل إسلامه أو بعده. أسلم قبل فتح مكة، وسرعان ما أثبت عبقريته العسكرية في مؤتة حيث أنقذ الجيش الإسلامي بانسحاب تكتيكي مبهر. كان له الدور الأبرز في حروب الردة التي وحدت الجزيرة العربية، ثم قاد الفتوحات الإسلامية في العراق والشام. من أشهر معاركه معركة اليرموك التي قصمت ظهر الروم. عزله الخليفة عمر بن الخطاب عن القيادة ليُعلم الناس أن النصر من عند الله لا من عند خالد. توفي في حمص على فراشه، وكان يتمنى الشهادة في ساحة المعركة قائلاً: 'ما في جسدي موضع شبر إلا وفيه ضربة بسيف أو رمية بسهم أو طعنة برمح'.</p>"
    },
    "bilal-enhanced": {
        descriptionArabic: "أول مؤذن في الإسلام. اشتهر بصوته العذب وصبره على التعذيب في سبيل الله.",
        longBiographyArabic: "<p><strong>بلال بن رباح</strong>، مؤذن الرسول ﷺ، رمز الصبر والثبات على المبدأ. كان عبداً حبشياً يعذب في رمضاء مكة ليرتد عن الإسلام، فكان يردد 'أحدٌ أحد'. اشتراه أبو بكر الصديق وأعتقه. اختاره النبي ﷺ ليكون أول مؤذن في الإسلام لجمال صوته وقوة إيمانه. شهد جميع المشاهد مع النبي، وكان له شرف الأذان فوق الكعبة يوم فتح مكة. بعد وفاة النبي ﷺ، توقف عن الأذان حزناً عليه، ولم يؤذن إلا نادراً. شارك في الفتوحات بالشام وتوفي في دمشق. قصته تعلمنا أن الإسلام رفع من شأن الإنسان بالتقوى، لا بالنسب ولا باللون.</p>"
    },
    "salman-enhanced": {
        descriptionArabic: "الباحث عن الحقيقة، صاحب فكرة حفر الخندق التي حمت المدينة من الأحزاب.",
        longBiographyArabic: "<p><strong>سلمان الفارسي</strong>، الباحث عن الحقيقة. ترك بلاده فارس وقطع مسافات شاسعة، وعاش العبودية والغربة بحثاً عن الدين الحق، حتى وصل إلى المدينة وآمن بالنبي ﷺ. كان صاحب المشورة الحاسمة في غزوة الخندق، حيث اقترح حفر خندق حول المدينة لحمايتها من جيوش الأحزاب، وهي تكتيك لم يعرفه العرب من قبل. قال عنه النبي ﷺ: 'سلمان منا آل البيت'. عُرف بزهده وحكمته وعلمه، وكان والياً على المدائن وكان يأكل من عمل يده.</p>"
    },
    "saad-enhanced": { descriptionArabic: "خال النبي ﷺ، وأول من رمى سهماً في سبيل الله، وقائد معركة القادسية." },
    "zaid-enhanced": { descriptionArabic: "جامع القرآن الكريم وكاتب الوحي. تميز بذكائه وعلمه بالموارث." },
    "abu-ubaidah": { descriptionArabic: "أمين هذه الأمة، وقائد الجيوش في فتح الشام." },
    "abu-dhar": { descriptionArabic: "الزاهد الصادق، الذي عاش وحيداً ومات وحيداً كما أخبر عنه النبي." },
    "aisha-enhanced": { descriptionArabic: "أم المؤمنين، والعالمة الفقيهة التي روت الكثير من أحاديث النبي." },
    "fatimah-enhanced": { descriptionArabic: "سيدة نساء العالمين، ابنة النبي وأحب الناس إليه." },
    "hassan-enhanced": { descriptionArabic: "سبط النبي وسيد شباب أهل الجنة، الذي أصلح بين فئتين عظيمتين من المسلمين." },
    "hussein-enhanced": { descriptionArabic: "سبط النبي وسيد شباب أهل الجنة، استشهد في كربلاء مدافعاً عن الحق." },
    "abdullah-umar-enhanced": { descriptionArabic: "الصحابي المتقي، كان أشد الناس اتباعاً لأثر النبي ﷺ." },
    "anas-enhanced": { descriptionArabic: "خدم النبي ﷺ عشر سنوات، ودعا له النبي بكثرة المال والولد وطول العمر." },
    "amir-enhanced": { descriptionArabic: "راعي غنم أبي بكر، ورفيق النبي وأبي بكر في رحلة الهجرة." },
    "sumayyah-enhanced": { descriptionArabic: "أول شهيدة في الإسلام، قُتلت لصبرها وثباتها على دينها." },
    "khadijah-enhanced": { descriptionArabic: "أول من آمن بالنبي من النساء، وساندته بنفسها ومالها." },
    "hamza-enhanced": { descriptionArabic: "أسد الله ورسوله، عم النبي ﷺ وسيد الشهداء." },
    "ammar-enhanced": { descriptionArabic: "الذي تقتله الفئة الباغية، صبر هو وأهله على العذاب في مكة." },
    "jafar-enhanced": { descriptionArabic: "جعفر الطيار، الذي أبدله الله بجناحين يطير بهما في الجنة، استشهد في مؤتة." },
    "abdur-rahman-enhanced": { descriptionArabic: "أحد العشرة المبشرين بالجنة، واشتهر بكرمه وتجارته الرابحة." },
    "talha-enhanced": { descriptionArabic: "طلحة الخير، الذي دافع عن النبي يوم أحد حتى شلت يده." },
    "zubayr-enhanced": { descriptionArabic: "حواري رسول الله، وأول من سل سيفاً في سبيل الله." },
    "said-enhanced": { descriptionArabic: "أحد العشرة المبشرين بالجنة، وكان مجاب الدعوة." },
    "abu-hurairah-enhanced": { descriptionArabic: "راوية الإسلام، أكثر الصحابة رواية للحديث الشريف." },
    "muadh-enhanced": { descriptionArabic: "أعلم الأمة بالحلال والحرام، بعثه النبي قاضياً ومعلماً لليمن." },
    "abdullah-abbas-enhanced": { descriptionArabic: "حبر الأمة وترجمان القرآن، دعا له النبي بالفقه في الدين." },
    "usama-enhanced": { descriptionArabic: "الحب ابن الحب، أصغر قائد جيش في عهد النبي ﷺ." }
};

let updatedCount = 0;

data.sahaba.forEach(sahabi => {
    const slug = sahabi.slug;
    const trans = translations[slug] || translations[slug.replace('-enhanced', '')] || translations[slug + '-enhanced'];

    if (trans) {
        if (trans.descriptionArabic && !sahabi.descriptionArabic) {
            sahabi.descriptionArabic = trans.descriptionArabic;
            console.log(`Updated descriptionArabic for ${sahabi.name}`);
        }
        if (trans.longBiographyArabic && !sahabi.longBiographyArabic) {
            sahabi.longBiographyArabic = trans.longBiographyArabic;
            console.log(`Updated longBiographyArabic for ${sahabi.name}`);
        }
        updatedCount++;
    }
});

fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
console.log(`Repaired ${updatedCount} entries.`);
