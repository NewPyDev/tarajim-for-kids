const fs = require('fs');
const path = require('path');

const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');

const arabicContent = {
    "abu-bakr-enhanced": {
        "keyLessonsArabic": [
            "الصداقة الحقيقية تعني دعم الآخرين في الأوقات الصعبة",
            "الإيمان بالحقيقة يتطلب الشجاعة واليقين",
            "القيادة تعني وضع احتياجات المجتمع أولاً",
            "الكرم يجب أن يستخدم لمساعدة المحتاجين"
        ],
        "timelineArabic": [
            { "year": "573", "event": "ولد في مكة" },
            { "year": "610", "event": "أصبح أول رجل يعتنق الإسلام" },
            { "year": "622", "event": "هاجر إلى المدينة مع النبي" },
            { "year": "632", "event": "أصبح الخليفة الأول بعد وفاة النبي" },
            { "year": "634", "event": "توفي في المدينة ودفن بجوار النبي" }
        ],
        "timeline": [
            { "year": "573", "event": "Born in Mecca" },
            { "year": "610", "event": "Became the first adult male to accept Islam" },
            { "year": "622", "event": "Migrated to Medina with the Prophet" },
            { "year": "632", "event": "Became the first Caliph" },
            { "year": "634", "event": "Passed away in Medina" }
        ]
    },
    "umar-enhanced": {
        "keyLessonsArabic": [
            "يمكن للناس أن يتغيروا تماماً عندما يجدون الحقيقة",
            "القادة الحقيقيون يخدمون شعبهم، لا أنفسهم",
            "العدالة يجب أن تطبق بالتساوي على الجميع",
            "القوة يجب أن تستخدم لحماية الضعفاء"
        ],
        "timelineArabic": [
            { "year": "584", "event": "ولد في مكة" },
            { "year": "616", "event": "اعتنق الإسلام، مما أعز المسلمين" },
            { "year": "634", "event": "أصبح الخليفة الثاني" },
            { "year": "637", "event": "فتح القدس واستلم مفاتيحها سلمياً" },
            { "year": "644", "event": "استشهد ودفن بجوار صاحبيه" }
        ],
        "timeline": [
            { "year": "584", "event": "Born in Mecca" },
            { "year": "616", "event": "Accepted Islam, strengthening the Muslims" },
            { "year": "634", "event": "Became the second Caliph" },
            { "year": "637", "event": "Conquered Jerusalem peacefully" },
            { "year": "644", "event": "Martyred and buried next to his companions" }
        ]
    },
    "uthman-enhanced": {
        "keyLessonsArabic": [
            "الكرم والثروة يجب أن يستخدما في طاعة الله وخدمة المجتمع",
            "حفظ العلم الشرعي من أعظم الخدمات للبشرية",
            "أحياناً يكون تجنب الفتنة أهم من الدفاع عن النفس",
            "التواضع والحياء صفات جميلة حتى للقادة"
        ],
        "timelineArabic": [
            { "year": "576", "event": "ولد في الطائف/مكة" },
            { "year": "611", "event": "من أوائل من أسلموا على يد أبي بكر" },
            { "year": "644", "event": "اختير ليكون الخليفة الثالث" },
            { "year": "651", "event": "أمر بجمع القرآن في مصحف واحد" },
            { "year": "656", "event": "استشهد في داره وهو يقرأ القرآن" }
        ],
        "timeline": [
            { "year": "576", "event": "Born in Taif/Mecca" },
            { "year": "611", "event": "Among the first to accept Islam" },
            { "year": "644", "event": "Chosen as the third Caliph" },
            { "year": "651", "event": "Ordered the standardization of the Quran" },
            { "year": "656", "event": "Martyred in his home while reading Quran" }
        ]
    },
    "ali-enhanced": {
        "keyLessonsArabic": [
            "الشجاعة الحقيقية هي الوقوف مع الحق وإن كان صعباً",
            "العلم والحكمة أغلى من القوة الجسدية",
            "العدالة يجب أن لا تحابي أحداً",
            "على القائد أن يكون متواضعاً وقريباً من الناس"
        ],
        "timelineArabic": [
            { "year": "601", "event": "ولد داخل الكعبة في مكة" },
            { "year": "610", "event": "أول من أسلم من الصبيان" },
            { "year": "622", "event": "نام في فراش النبي ليلة الهجرة" },
            { "year": "624", "event": "تزوج فاطمة الزهراء بنت النبي" },
            { "year": "656", "event": "أصبح الخليفة الرابع" },
            { "year": "661", "event": "استشهد في الكوفة" }
        ],
        "timeline": [
            { "year": "601", "event": "Born inside the Kaaba in Mecca" },
            { "year": "610", "event": "First child to accept Islam" },
            { "year": "622", "event": "Slept in the Prophet's bed during Hijrah" },
            { "year": "624", "event": "Married Fatimah, daughter of the Prophet" },
            { "year": "656", "event": "Became the fourth Caliph" },
            { "year": "661", "event": "Martyred in Kufa" }
        ]
    },
    "khalid-enhanced": {
        "keyLessonsArabic": [
            "المهارة العسكرية موهبة يمكن تسخيرها للحق",
            "الطاعة للقائد واجبة حتى لو عزلك",
            "الإخلاص لله أهم من المناصب والألقاب",
            "التخطيط الاستراتيجي سبب للنصر بعد توفيق الله"
        ],
        "timelineArabic": [
            { "year": "592", "event": "ولد في مكة" },
            { "year": "625", "event": "قاد فرسان قريش في أحد" },
            { "year": "629", "event": "أسلم ولقبه النبي بسيف الله المسلول" },
            { "year": "636", "event": "قاد المسلمين في معركة اليرموك" },
            { "year": "642", "event": "توفي على فراشه في حمص" }
        ],
        "timeline": [
            { "year": "592", "event": "Born in Mecca" },
            { "year": "625", "event": "Led Quraysh cavalry at Uhud" },
            { "year": "629", "event": "Accepted Islam; titled Sword of Allah" },
            { "year": "636", "event": "Led Muslims at Battle of Yarmouk" },
            { "year": "642", "event": "Passed away in Homs" }
        ]
    },
    "bilal-enhanced": {
        "keyLessonsArabic": [
            "الإيمان يمنح القوة للصبر على الأذى",
            "لا فضل لعربي على أعجمي إلا بالتقوى",
            "الصوت الجميل نعمة يجب استخدامها في الخير",
            "الثبات على المبدأ يرفع قدر الإنسان"
        ],
        "timelineArabic": [
            { "year": "580", "event": "ولد في مكة مستعبداً" },
            { "year": "610", "event": "من السابقين للإسلام وعذب بسببه" },
            { "year": "622", "event": "أذن لأول مرة في المدينة" },
            { "year": "630", "event": "أذن فوق الكعبة يوم الفتح" },
            { "year": "640", "event": "توفي في دمشق" }
        ],
        "timeline": [
            { "year": "580", "event": "Born in Mecca as a slave" },
            { "year": "610", "event": "Among first to accept Islam; tortured" },
            { "year": "622", "event": "Called the Adhan for the first time" },
            { "year": "630", "event": "Called Adhan atop Kaaba at Conquest of Mecca" },
            { "year": "640", "event": "Passed away in Damascus" }
        ]
    },
    "saad-enhanced": {
        "keyLessonsArabic": [
            "استجابة الدعاء كرامة للصالحين",
            "بر الوالدين واجب لكن لا طاعة لمخلوق في معصية الخالق",
            "الدقة والمهارة (كالرمي) محبوبة في الإسلام",
            "السبق إلى الخيرات شرف عظيم"
        ],
        "timelineArabic": [
            { "year": "595", "event": "ولد في مكة" },
            { "year": "610", "event": "أسلم وهو ابن 17 سنة" },
            { "year": "624", "event": "أول من رمى سهماً في سبيل الله" },
            { "year": "636", "event": "قاد معركة القادسية وهزم الفرس" },
            { "year": "674", "event": "توفي في العقيق ودفن بالبقيع" }
        ],
        "timeline": [
            { "year": "595", "event": "Born in Mecca" },
            { "year": "610", "event": "Accepted Islam at age 17" },
            { "year": "624", "event": "First to shoot an arrow for Islam" },
            { "year": "636", "event": "Led Battle of Qadisiyyah against Persia" },
            { "year": "674", "event": "Passed away in Al-Aqiq" }
        ]
    },
    // ... add others if time permits or generic fix
};

async function applyTranslations() {
    try {
        const data = JSON.parse(fs.readFileSync(SAHABA_FILE, 'utf8'));
        let updateCount = 0;

        for (const sahabi of data.sahaba) {
            // Check if we have manual content for this slug
            // Look for both slug and slug-enhanced keys just in case
            let manualData = arabicContent[sahabi.slug];
            if (!manualData && !sahabi.slug.includes('enhanced')) {
                manualData = arabicContent[sahabi.slug + '-enhanced'];
            }
            // Also try removing enhanced
            if (!manualData && sahabi.slug.includes('enhanced')) {
                manualData = arabicContent[sahabi.slug.replace('-enhanced', '')];
            }

            if (manualData) {
                console.log(`Applying manual translations for ${sahabi.name}`);
                if (manualData.keyLessonsArabic) {
                    sahabi.keyLessonsArabic = manualData.keyLessonsArabic;
                }
                if (manualData.timelineArabic) {
                    sahabi.timelineArabic = manualData.timelineArabic;
                }
                if (manualData.timeline) {
                    sahabi.timeline = manualData.timeline;
                }
                updateCount++;
            }
        }

        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2));
        console.log(`Updated ${updateCount} sahaba with manual translations.`);

    } catch (error) {
        console.error("Error applying translations:", error);
    }
}

applyTranslations();
