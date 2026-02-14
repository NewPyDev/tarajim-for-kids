const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.argv[2];
const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');

if (!API_KEY) {
    console.error('Usage: node scripts/generate-quizzes.js <YOUR_API_KEY>');
    process.exit(1);
}

async function generateQuiz(sahabiName, biography) {
    const prompt = `
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
        path: `/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        },
        timeout: 30000
    };

    // Delay to respect rate limits
    console.log("Waiting 5s to respect rate limit...");
    await new Promise(r => setTimeout(r, 5000));

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

async function main() {
    try {
        const rawData = fs.readFileSync(SAHABA_FILE, 'utf8');
        const data = JSON.parse(rawData);
        let updated = false;

        console.log(`Found ${data.sahaba.length} Sahaba. Checking for missing quizzes...`);

        for (const sahabi of data.sahaba) {
            if (!sahabi.quiz || sahabi.quiz.length === 0) {
                console.log(`Generating quiz for ${sahabi.name}...`);
                try {
                    const quiz = await generateQuiz(sahabi.name, sahabi.longBiography || sahabi.description);
                    if (quiz) {
                        sahabi.quiz = quiz;
                        updated = true;
                        // Save immediately to prevent data loss on stop
                        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
                        console.log(`✅ Generated and SAVED quiz for ${sahabi.name}`);
                    }
                } catch (err) {
                    console.error(`❌ Failed quiz for ${sahabi.name}:`, err.message);
                }
            }
        }

        if (!updated) {
            console.log('No updates needed.');
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
