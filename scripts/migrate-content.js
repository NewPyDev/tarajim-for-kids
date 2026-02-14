const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function migrate() {
    try {
        const data = JSON.parse(fs.readFileSync(SAHABA_FILE, 'utf8'));
        const sahaba = data.sahaba;
        let updatedCount = 0;

        for (let i = 0; i < sahaba.length; i++) {
            const sahabi = sahaba[i];
            console.log(`Processing ${sahabi.name}...`);

            // specific override for saad who has no enhanced file but only saad.html
            // actually just look for both
            let htmlFile = path.join(PUBLIC_DIR, `${sahabi.slug}.html`);

            // prefer enhanced version if it exists
            // logic: if slug contains "enhanced", use it. If not, try adding "-enhanced".
            // but the slug in json ALREADY says "enhanced" for some.
            // checking file existence:

            if (!fs.existsSync(htmlFile)) {
                // try adding -enhanced if not present
                if (!sahabi.slug.includes('enhanced')) {
                    const enhancedPath = path.join(PUBLIC_DIR, `${sahabi.slug}-enhanced.html`);
                    if (fs.existsSync(enhancedPath)) {
                        htmlFile = enhancedPath;
                    }
                } else {
                    // try removing -enhanced
                    const cleanPath = path.join(PUBLIC_DIR, sahabi.slug.replace('-enhanced', '') + '.html');
                    if (fs.existsSync(cleanPath)) {
                        htmlFile = cleanPath;
                    }
                }
            }

            if (!fs.existsSync(htmlFile)) {
                console.log(`  No HTML file found for ${sahabi.slug}`);
                continue;
            }

            console.log(`  Reading from ${path.basename(htmlFile)}`);
            const htmlContent = fs.readFileSync(htmlFile, 'utf8');

            // extract the JS content object
            // pattern: const content = { ... }; OR const langContent = { ... };
            const regex = /const\s+(?:content|langContent)\s*=\s*({[\s\S]*?});/;
            const match = htmlContent.match(regex);

            if (match && match[1]) {
                const sandbox = {};
                try {
                    vm.runInNewContext(`result = ${match[1]}`, sandbox);
                    const content = sandbox.result;

                    // 1. Arabic Name
                    if (content.ar && content.ar.title) {
                        // remove html tags if any
                        sahabi.nameArabic = content.ar.title.replace(/<[^>]*>?/gm, '').split(' (')[0].trim();
                    }

                    // 2. Arabic Biography
                    if (content.ar) {
                        if (content.ar.biography && content.ar.biography.text) {
                            sahabi.longBiographyArabic = content.ar.biography.text;
                        } else {
                            // concatenate other fields if bio is missing (like in saad.html)
                            let bioParts = [];
                            // exclude standard keys
                            const exclude = ['title', 'subtitle', 'sectionTitle', 'backLink', 'lessons', 'quote', 'timeline'];
                            for (const key in content.ar) {
                                if (!exclude.includes(key) && typeof content.ar[key] === 'object' && content.ar[key].text) {
                                    bioParts.push(`<p><strong>${content.ar[key].title}</strong>: ${content.ar[key].text}</p>`);
                                }
                            }
                            if (bioParts.length > 0) {
                                sahabi.longBiographyArabic = bioParts.join('\n');
                            }
                        }
                    }

                    // 3. Arabic Lessons
                    if (content.ar) {
                        if (content.ar.lessons && Array.isArray(content.ar.lessons)) {
                            sahabi.keyLessonsArabic = content.ar.lessons;
                        } else if (content.ar.lessons && typeof content.ar.lessons === 'object' && !content.ar.lessons.title) {
                            // sometimes it's an object with keys? unlikely based on viewing
                        } else {
                            // Check for lesson1, lesson2 properties at the root or under lessons
                            const lessons = [];
                            // check root of content.ar
                            for (let k = 1; k <= 10; k++) {
                                if (content.ar[`lesson${k}`]) {
                                    lessons.push(content.ar[`lesson${k}`]);
                                }
                            }
                            if (lessons.length > 0) {
                                sahabi.keyLessonsArabic = lessons;
                            }
                        }
                    }

                    // 4. Quote
                    if (content.ar) {
                        if (content.ar.quote && content.ar.quote.text) {
                            sahabi.famousQuoteArabic = content.ar.quote.text;
                        } else if (content.ar.quoteText) {
                            sahabi.famousQuoteArabic = content.ar.quoteText;
                        }
                    }

                    // 5. Timeline
                    // Some files might not have timeline
                    if (content.ar && content.ar.timeline && Array.isArray(content.ar.timeline)) {
                        sahabi.timelineArabic = content.ar.timeline;
                    }

                    // 6. English Timeline (if missing)
                    if (content.en && content.en.timeline && Array.isArray(content.en.timeline)) {
                        sahabi.timeline = content.en.timeline;
                    }

                    updatedCount++;

                } catch (e) {
                    console.error(`Error parsing content for ${sahabi.name}:`, e);
                }
            }
        }

        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2));
        console.log(`Updated ${updatedCount} sahaba.`);

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
