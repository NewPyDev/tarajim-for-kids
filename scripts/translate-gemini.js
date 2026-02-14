const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || process.argv[2];

if (!API_KEY) {
    console.error('Please provide your Gemini API key as an argument or set GEMINI_API_KEY environment variable.');
    console.error('Usage: node scripts/translate-gemini.js <YOUR_API_KEY>');
    process.exit(1);
}

const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');
const data = JSON.parse(fs.readFileSync(SAHABA_FILE, 'utf8'));

let SELECTED_MODEL = '';

async function getBestModel() {
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models?key=${API_KEY}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    if (json.models) {
                        // Filter for models that support generateContent
                        const candidates = json.models.filter(m =>
                            m.supportedGenerationMethods &&
                            m.supportedGenerationMethods.includes('generateContent')
                        );

                        // Prefer 1.5-flash, then 1.5-pro, then 1.0-pro, then any
                        let best = candidates.find(m => m.name.includes('gemini-1.5-flash'));
                        if (!best) best = candidates.find(m => m.name.includes('gemini-1.5-pro'));
                        if (!best) best = candidates.find(m => m.name.includes('gemini-1.0-pro'));
                        if (!best) best = candidates.find(m => m.name.includes('gemini'));
                        if (!best) best = candidates[0];

                        if (best) {
                            // name comes as "models/gemini-..."
                            resolve(best.name.replace('models/', ''));
                        } else {
                            reject(new Error('No suitable model found.'));
                        }
                    } else {
                        reject(new Error('Failed to list models: ' + JSON.stringify(json)));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

const DELAY_MS = 4000; // Wait 4 seconds between requests to stay under 15 RPM

async function translateText(text, targetLang = 'ar', context = '') {
    if (!SELECTED_MODEL) return null;

    const prompt = `Translate the following ${context} into Arabic. 
    Maintain the tone: respectful, educational, suitable for children.
    Return ONLY the translated text, no markdown code blocks unless the input had them.
    
    Input:
    "${text}"
    `;

    const requestBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${SELECTED_MODEL}:generateContent?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    // Retry logic
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            return await new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let responseData = '';
                    res.on('data', chunk => responseData += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(responseData);
                            if (json.error) {
                                if (json.error.code === 429) {
                                    reject(new Error('RATE_LIMIT'));
                                } else {
                                    console.error('API Error:', JSON.stringify(json, null, 2));
                                    resolve(null);
                                }
                            } else if (json.candidates && json.candidates[0] && json.candidates[0].content) {
                                resolve(json.candidates[0].content.parts[0].text);
                            } else {
                                resolve(null);
                            }
                        } catch (e) { reject(e); }
                    });
                });
                req.on('error', reject);
                req.write(requestBody);
                req.end();
            });
        } catch (e) {
            if (e.message === 'RATE_LIMIT') {
                console.log(`  Rate limit hit. Waiting 60 seconds before retry ${attempt}...`);
                await new Promise(r => setTimeout(r, 60000));
            } else {
                return null;
            }
        }
    }
    return null;
}

async function processSahaba() {
    try {
        console.log('Detecting available Gemini models...');
        SELECTED_MODEL = await getBestModel();
        console.log(`Using model: ${SELECTED_MODEL}`);
    } catch (e) {
        console.error('Error finding model:', e.message);
        return;
    }

    let updatedCount = 0;

    for (const sahabi of data.sahaba) {
        let modified = false;

        console.log(`Checking ${sahabi.name}...`);

        if (!sahabi.longBiographyArabic && sahabi.longBiography) {
            console.log(`  Translating biography for ${sahabi.name}...`);
            const translation = await translateText(sahabi.longBiography, 'ar', 'biography of a Sahabi');
            if (translation) {
                sahabi.longBiographyArabic = translation.replace(/^```html|```$/g, '').trim();
                modified = true;
            }
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        if ((!sahabi.keyLessonsArabic || sahabi.keyLessonsArabic.length === 0) && sahabi.keyLessons) {
            console.log(`  Translating lessons for ${sahabi.name}...`);
            const lessonsString = sahabi.keyLessons.join('|||');
            const translation = await translateText(lessonsString, 'ar', 'list of key lessons separated by |||');
            if (translation) {
                sahabi.keyLessonsArabic = translation.split('|||').map(s => s.trim());
                modified = true;
            }
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        if ((!sahabi.timelineArabic || sahabi.timelineArabic.length === 0) && sahabi.timeline) {
            console.log(`  Translating timeline for ${sahabi.name}...`);
            const translation = await translateText(JSON.stringify(sahabi.timeline), 'ar', 'JSON array of timeline events (translate "event" values only)');

            if (translation) {
                try {
                    const cleanJson = translation.replace(/```json|```/g, '').trim();
                    const parsedTimeline = JSON.parse(cleanJson);
                    if (Array.isArray(parsedTimeline)) {
                        sahabi.timelineArabic = parsedTimeline;
                        modified = true;
                    }
                } catch (e) {
                    console.error('  Failed to parse timeline JSON translation', e);
                }
            }
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        if (modified) {
            updatedCount++;
            // Save incrementally on every update with correct encoding
            fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), { encoding: 'utf8' });
        }
    }

    if (updatedCount > 0) {
        console.log(`\nSuccess! Updated ${updatedCount} Sahaba with translations.`);
    } else {
        console.log('\nNo updates needed.');
    }
}

processSahaba().catch(console.error);
