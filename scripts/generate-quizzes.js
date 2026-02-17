const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.argv[2];
const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');

if (!API_KEY) {
    console.error('Usage: node scripts/generate-quizzes.js <YOUR_API_KEY>');
    process.exit(1);
}

async function generateQuiz(sahabiName, biography, language = 'en') {
    const isAr = language === 'ar';
    const prompt = isAr ? `
    استنادًا إلى سيرة ${sahabiName} التالية، قم بإنشاء اختبار من 3 أسئلة متعددة الخيارات للأطفال.
    
    السيرة: "${biography.substring(0, 2000)}..."

    أخرج فقط JSON صالحًا بهذا التنسيق:
    [
        {
            "question": "نص السؤال؟",
            "options": ["الخيار أ", "الخيار ب", "الخيار ج"],
            "correctAnswer": 0 // مؤشر الإجابة الصحيحة (0 أو 1 أو 2)
        },
        ...
    ]
    ` : `
    Based on the following biography of ${sahabiName}, generate a quiz with 3 multiple-choice questions for children.
    
    Biography: "${biography.substring(0, 2000)}..."

    Output ONLY valid JSON in this format:
    [
        {
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C"],
            "correctAnswer": 0 // Index of correct option (0, 1, or 2)
        },
        ...
    ]
    `;

    const requestBody = JSON.stringify({
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
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
        timeout: 30000
    };

    // Delay to respect rate limits (60s to be ultra-conservative)
    console.log(`Waiting 60s to respect rate limit (${language})...`);
    await new Promise(r => setTimeout(r, 60000));

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                try {
                    const responseString = Buffer.concat(data).toString();
                    if (res.statusCode !== 200) {
                        return reject(new Error(`API Error ${res.statusCode}: ${responseString}`));
                    }
                    const json = JSON.parse(responseString);
                    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) {
                        resolve(JSON.parse(content));
                    } else {
                        reject(new Error('No content in response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(requestBody);
        req.end();
    });
}

async function generateQuizWithRetry(sahabiName, biography, language, maxRetries = 5) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            return await generateQuiz(sahabiName, biography, language);
        } catch (err) {
            attempts++;
            const isRateLimit = err.message.includes('429') || err.message.includes('503') || err.message.includes('Quota');

            if (isRateLimit) {
                const delay = 60000 * attempts; // 1 min, 2 min, 3 min...
                console.warn(`⚠️ Rate Limit hit for ${sahabiName} (${language}). Waiting ${delay / 1000}s before retry ${attempts}/${maxRetries}...`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                throw err; // Rethrow other errors
            }
        }
    }
    throw new Error(`Failed to generate quiz for ${sahabiName} after ${maxRetries} retries.`);
}

async function main() {
    try {
        const rawData = fs.readFileSync(SAHABA_FILE, 'utf8');
        const data = JSON.parse(rawData);
        let updated = false;

        // HARD LIMIT: Stop after this many successful API calls to stay under free tier quota
        const MAX_REQUESTS_PER_RUN = 18;
        let requestCount = 0;

        console.log(`Found ${data.sahaba.length} Sahaba. Checking for missing quizzes...`);
        console.log(`Will stop after ${MAX_REQUESTS_PER_RUN} requests to respect daily quota.`);

        for (const sahabi of data.sahaba) {
            if (requestCount >= MAX_REQUESTS_PER_RUN) {
                console.log(`\n🛑 Reached daily limit of ${MAX_REQUESTS_PER_RUN} requests. Stopping to avoid rate limits.`);
                console.log(`Run the script again tomorrow to continue.`);
                break;
            }

            // English Quiz
            if (!sahabi.quiz || sahabi.quiz.length === 0) {
                if (requestCount >= MAX_REQUESTS_PER_RUN) break;
                console.log(`[${requestCount + 1}/${MAX_REQUESTS_PER_RUN}] Generating English quiz for ${sahabi.name}...`);
                try {
                    const quiz = await generateQuizWithRetry(sahabi.name, sahabi.longBiography || sahabi.description, 'en');
                    if (quiz) {
                        sahabi.quiz = quiz;
                        updated = true;
                        requestCount++;
                        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
                        console.log(`✅ Generated and SAVED English quiz for ${sahabi.name} (${requestCount}/${MAX_REQUESTS_PER_RUN})`);
                    }
                } catch (err) {
                    console.error(`❌ Failed English quiz for ${sahabi.name}:`, err.message);
                }
            }

            // Arabic Quiz
            if (!sahabi.quizArabic || sahabi.quizArabic.length === 0) {
                if (requestCount >= MAX_REQUESTS_PER_RUN) break;
                console.log(`[${requestCount + 1}/${MAX_REQUESTS_PER_RUN}] Generating Arabic quiz for ${sahabi.name}...`);
                // Use Arabic bio if available, else fallback to English description
                const bioAr = sahabi.longBiographyArabic || sahabi.descriptionArabic || sahabi.longBiography || sahabi.description;
                try {
                    const quizAr = await generateQuizWithRetry(sahabi.nameArabic || sahabi.name, bioAr, 'ar');
                    if (quizAr) {
                        sahabi.quizArabic = quizAr;
                        updated = true;
                        requestCount++;
                        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
                        console.log(`✅ Generated and SAVED Arabic quiz for ${sahabi.name} (${requestCount}/${MAX_REQUESTS_PER_RUN})`);
                    }
                } catch (err) {
                    console.error(`❌ Failed Arabic quiz for ${sahabi.name}:`, err.message);
                }
            }
        }

        // Summary
        let remainingEn = data.sahaba.filter(s => !s.quiz || s.quiz.length === 0).length;
        let remainingAr = data.sahaba.filter(s => !s.quizArabic || s.quizArabic.length === 0).length;
        console.log(`\n📊 Summary: ${requestCount} requests used this run.`);
        console.log(`   Remaining: ${remainingEn} English, ${remainingAr} Arabic quizzes.`);

        if (remainingEn === 0 && remainingAr === 0) {
            console.log('🎉 All quizzes generated!');
        } else {
            console.log('⏳ Run the script again tomorrow to finish.');
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
