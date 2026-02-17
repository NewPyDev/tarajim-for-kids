const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.argv[2];
const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');

if (!API_KEY) {
    console.error('Usage: node scripts/generate-sahaba.js <YOUR_API_KEY>');
    process.exit(1);
}

// List of Sahaba to generate
const NEW_SAHABA_NAMES = [
    "Talha ibn Ubaydullah",
    "Zubayr ibn al-Awwam",
    "Abd al-Rahman ibn Awf",
    "Sa'id ibn Zayd",
    "Mus'ab ibn Umair",
    "Khadijah bint Khuwaylid",
    "Aisha bint Abu Bakr",
    "Hamza ibn Abdul-Muttalib",
    "Ja'far ibn Abi Talib"
];

const PROMPT_TEMPLATE = `
You are an expert Islamic historian holding a PhD in Seerah. 
Generate a JSON object for the Sahabi: "{NAME}".
The JSON must strictly follow this schema (no other text, just JSON).
Ensure the content is accurate, respectful, and suitable for children/teens.

{
  "name": "{NAME}",
  "nameArabic": "Arabic Name",
  "description": "Short description in English (1 sentence)",
  "descriptionArabic": "Short description in Arabic (1 sentence)",
  "longBiography": "Detailed biography in English (approx 400 words). Focus on their virtues, key contributions, and character. HTML formatting allowed (<p>, <strong>).",
  "longBiographyArabic": "Detailed biography in Arabic (approx 400 words). HTML formatting allowed (<p>, <strong>).",
  "keyLessons": ["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4"],
  "keyLessonsArabic": ["Lesson 1 Arabic", "Lesson 2 Arabic", "Lesson 3 Arabic", "Lesson 4 Arabic"],
  "famousQuote": "A famous quote by them or about them in English",
  "famousQuoteArabic": "The same quote in Arabic",
  "timeline": [
    {"year": "Year", "event": "Event in English (brief)"},
    {"year": "Year", "event": "Event in English (brief)"},
    {"year": "Year", "event": "Event in English (brief)"}
  ],
  "timelineArabic": [
    {"year": "Year", "event": "Event in Arabic (brief)"},
    {"year": "Year", "event": "Event in Arabic (brief)"},
    {"year": "Year", "event": "Event in Arabic (brief)"}
  ],
  "categories": ["category1", "category2"],
  "birthYear": "Year",
  "deathYear": "Year",
  "slug": "", 
  "icon": "Emoji"
}

IMPORTANT:
- Ensure all Arabic text is properly encoded UTF-8.
- "slug" should be the English name lowercased with hyphens (e.g. "talha-ibn-ubaydullah").
- "categories" should be chosen from: ["caliphs", "bravery", "wisdom", "generosity", "patience", "loyalty", "leadership", "scholars", "family"].
- "icon" should be a relevant emoji (e.g. ⚔️ for warriors, 📜 for scholars, 🕌 for pious figures).
`;

const DELAY_MS = 5000; // 5 seconds delay to avoid rate limits

function generateContent(sahabiName) {
    return new Promise((resolve, reject) => {
        const prompt = PROMPT_TEMPLATE.replace(/{NAME}/g, sahabiName);

        // Construct the request body for Gemini 1.5 Flash
        const requestBody = JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    try {
                        const error = JSON.parse(data);
                        // Check for 429
                        if (error.error && error.error.code === 429) {
                            return reject(new Error('RATE_LIMIT'));
                        }
                        return reject(new Error(`API Error: ${data}`));
                    } catch (e) {
                        return reject(new Error(`API Error status ${res.statusCode}: ${data}`));
                    }
                }

                try {
                    const json = JSON.parse(data);
                    let text = json.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (!text) {
                        return reject(new Error('No content generated'));
                    }

                    // Clean string to get valid JSON
                    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const sahabiData = JSON.parse(text);
                    resolve(sahabiData);
                } catch (e) {
                    reject(new Error(`Failed to parse generated JSON: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(requestBody);
        req.end();
    });
}

// Helper to normalize strings for comparison
function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
    try {
        if (!fs.existsSync(SAHABA_FILE)) {
            console.error(`File not found: ${SAHABA_FILE}`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(SAHABA_FILE, 'utf8');
        let data = JSON.parse(rawData);

        if (!data.sahaba) {
            data = { sahaba: [] };
        }

        const existingNames = new Set(data.sahaba.map(s => normalize(s.name)));
        let maxId = data.sahaba.reduce((max, s) => Math.max(max, s.id || 0), 0);
        let addedCount = 0;

        console.log(`Found ${data.sahaba.length} existing Sahaba.`);
        console.log(`Starting generation for ${NEW_SAHABA_NAMES.length} new Sahaba...`);

        for (const name of NEW_SAHABA_NAMES) {
            if (existingNames.has(normalize(name))) {
                console.log(`Skipping: ${name} (Already exists)`);
                continue;
            }

            console.log(`\nGenerating: ${name}...`);

            let attempts = 0;
            let success = false;

            while (attempts < 3 && !success) {
                try {
                    const newSahabi = await generateContent(name);

                    if (newSahabi) {
                        maxId++;
                        newSahabi.id = maxId;

                        // Basic validation
                        if (!newSahabi.name || !newSahabi.description) {
                            throw new Error('Generated data missing required fields');
                        }

                        data.sahaba.push(newSahabi);

                        // Save immediately to avoid data loss
                        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
                        console.log(`✅ added! (ID: ${maxId})`);
                        addedCount++;
                        success = true;
                    }
                } catch (err) {
                    attempts++;
                    console.error(`❌ Attempt ${attempts} failed: ${err.message}`);

                    if (err.message === 'RATE_LIMIT') {
                        console.log('Rate limit hit. Waiting 60 seconds...');
                        await new Promise(r => setTimeout(r, 60000));
                    } else if (attempts < 3) {
                        console.log('Retrying in 5 seconds...');
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }

            if (success) {
                // Standard delay between successful requests
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            } else {
                console.error(`Failed to generate ${name} after 3 attempts.`);
            }
        }

        console.log(`\nProcess Complete! Added ${addedCount} new Sahaba.`);

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
