const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.argv[2];
const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');

if (!API_KEY) {
    console.error('Usage: node scripts/generate-arabic-bio.js <YOUR_API_KEY>');
    process.exit(1);
}

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
    process.exit(1);
});

const DELAY_MS = 5000;

function buildPrompt(sahabi) {
    return `
You are an expert Islamic historian. I need you to translate and adapt the following English biography of the Sahabi "${sahabi.name}" into Arabic.

The Arabic biography should:
- Be a concise adaptation of the English version (approximately 200 words or less)
- Highlight the most important facts only
- Use proper Modern Standard Arabic (فصحى)
- Be accurate, respectful, and suitable for children/teens
- Use HTML formatting (<p>, <strong>) similar to the English version
- Include diacritics on important Islamic terms

Here is the English biography to translate:
---
${sahabi.longBiography}
---

Also provide:
1. Arabic key lessons (translate these English lessons): ${JSON.stringify(sahabi.keyLessons || [])}
2. Arabic timeline events (translate these): ${JSON.stringify(sahabi.timeline || [])}
3. Arabic famous quote: ${sahabi.famousQuote || 'N/A'}
4. Arabic description (1 sentence): translate "${sahabi.description || ''}"

Return ONLY a JSON object with these fields (no other text):
{
  "longBiographyArabic": "...",
  "keyLessonsArabic": ["...", "...", "...", "..."],
  "timelineArabic": [{"year": "...", "event": "..."}, ...],
  "famousQuoteArabic": "...",
  "descriptionArabic": "..."
}
`;
}

function generateContent(sahabi) {
    return new Promise((resolve, reject) => {
        const prompt = buildPrompt(sahabi);

        const requestBody = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
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
            },
            timeout: 120000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    if (res.statusCode === 429) return reject(new Error('RATE_LIMIT'));
                    return reject(new Error(`API Error ${res.statusCode}: ${data.substring(0, 200)}`));
                }

                try {
                    const json = JSON.parse(data);
                    let text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!text) return reject(new Error('No content generated'));

                    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const result = JSON.parse(text);
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => reject(new Error(`Request error: ${e.message}`)));
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.write(requestBody);
        req.end();
    });
}

async function main() {
    try {
        const rawData = fs.readFileSync(SAHABA_FILE, 'utf8');
        const data = JSON.parse(rawData);

        const missing = data.sahaba.filter(s => !s.longBiographyArabic || s.longBiographyArabic.length === 0);
        console.log(`Found ${data.sahaba.length} Sahaba. ${missing.length} missing Arabic biographies.`);

        if (missing.length === 0) {
            console.log('All Sahaba have Arabic biographies! Nothing to do.');
            return;
        }

        let generated = 0;

        for (const sahabi of missing) {
            if (!sahabi.longBiography) {
                console.log(`⚠️ Skipping ${sahabi.name} - no English biography to translate from.`);
                continue;
            }

            console.log(`\n[${generated + 1}/${missing.length}] Generating Arabic bio for ${sahabi.name}...`);

            let attempts = 0;
            let success = false;

            while (attempts < 5 && !success) {
                try {
                    console.log('  Waiting 5s before API call...');
                    await new Promise(r => setTimeout(r, DELAY_MS));

                    const result = await generateContent(sahabi);

                    if (result.longBiographyArabic) {
                        sahabi.longBiographyArabic = result.longBiographyArabic;
                        if (result.keyLessonsArabic) sahabi.keyLessonsArabic = result.keyLessonsArabic;
                        if (result.timelineArabic) sahabi.timelineArabic = result.timelineArabic;
                        if (result.famousQuoteArabic) sahabi.famousQuoteArabic = result.famousQuoteArabic;
                        if (result.descriptionArabic) sahabi.descriptionArabic = result.descriptionArabic;

                        // Save immediately
                        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
                        generated++;
                        console.log(`  ✅ Done! (${result.longBiographyArabic.length} chars)`);
                        success = true;
                    } else {
                        throw new Error('No longBiographyArabic in response');
                    }
                } catch (err) {
                    attempts++;
                    if (err.message === 'RATE_LIMIT') {
                        const delay = Math.min(60000 * Math.pow(2, attempts - 1), 300000);
                        console.error(`  ⏳ Rate limited. Waiting ${delay / 1000}s... (Attempt ${attempts}/5)`);
                        await new Promise(r => setTimeout(r, delay));
                    } else {
                        console.error(`  ❌ Failed (Attempt ${attempts}/5): ${err.message}`);
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }

            if (!success) {
                console.error(`  ❌ CRITICAL: Failed ${sahabi.name} after 5 attempts. Skipping.`);
                continue;
            }
        }

        console.log(`\n📊 Summary: Generated Arabic biographies for ${generated}/${missing.length} Sahaba.`);
    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
