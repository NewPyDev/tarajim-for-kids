const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.argv[2];
const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');
const AUDIO_DIR = path.join(__dirname, '../public/audio');

if (!API_KEY) {
    console.error('Usage: node scripts/generate-audio.js <YOUR_API_KEY>');
    process.exit(1);
}

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const DELAY_MS = 5000; // 5 seconds delay to avoid rate limits

async function generateAudio(text, voiceName = "Aoede") {
    // Remove HTML tags for TTS
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return null;

    // Check length. If > 4000, split.
    if (cleanText.length > 4000) {
        console.log(`Text too long (${cleanText.length} chars). Splitting...`);
        // Simple split by period to avoid cutting sentences. 
        // We want chunks ~3000 chars.
        const sentences = cleanText.match(/[^.!?]+[.!?]+(\s+|$)/g) || [cleanText];
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > 3500) {
                chunks.push(currentChunk);
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk);

        console.log(`Split into ${chunks.length} chunks.`);

        const audioBuffers = [];
        for (const chunk of chunks) {
            const buffer = await generateAudio(chunk, voiceName); // Recursive call
            if (buffer) {
                audioBuffers.push(buffer);
                // Brief pause between chunks to be nice to API
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        return Buffer.concat(audioBuffers);
    }

    const requestBody = JSON.stringify({
        contents: [{
            parts: [{ text: cleanText }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
        }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                const responseString = buffer.toString();

                if (res.statusCode !== 200) {
                    // Check for rate limit
                    if (res.statusCode === 429) return reject(new Error('RATE_LIMIT'));
                    return reject(new Error(`API Error ${res.statusCode}: ${responseString}`));
                }

                try {
                    const json = JSON.parse(responseString);
                    const parts = json.candidates?.[0]?.content?.parts;
                    const audioPart = parts?.find(p => p.inlineData && p.inlineData.mimeType.startsWith('audio'));

                    if (audioPart) {
                        resolve(Buffer.from(audioPart.inlineData.data, 'base64'));
                    } else {
                        reject(new Error('No audio data in response'));
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
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

        console.log(`Found ${data.sahaba.length} Sahaba. Checking for missing audio...`);

        for (const sahabi of data.sahaba) {
            // Initialize if missing
            if (!sahabi.audioFiles) {
                sahabi.audioFiles = { arabic: "", english: "" };
            }

            // Slug ensures unique filenames
            const slug = sahabi.slug || sahabi.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

            // Generate English Audio
            if (!sahabi.audioFiles.english && sahabi.longBiography) {
                console.log(`Generating English audio for ${sahabi.name}...`);
                try {
                    // Try generating
                    let attempts = 0;
                    let audioData = null;
                    while (!audioData && attempts < 3) {
                        try {
                            audioData = await generateAudio(sahabi.longBiography, "Aoede"); // Female voice
                        } catch (err) {
                            if (err.message === 'RATE_LIMIT') {
                                console.log('Rate limit (English). Waiting 60s...');
                                await new Promise(r => setTimeout(r, 60000));
                            } else {
                                throw err;
                            }
                            attempts++;
                        }
                    }

                    if (audioData) {
                        const fileName = `${slug}-en.mp3`;
                        fs.writeFileSync(path.join(AUDIO_DIR, fileName), audioData);
                        sahabi.audioFiles.english = `audio/${fileName}`;
                        updated = true;
                        console.log(`✅ Saved ${fileName}`);
                        await new Promise(r => setTimeout(r, DELAY_MS));
                    }
                } catch (err) {
                    console.error(`❌ Failed English audio for ${sahabi.name}:`, err.message);
                }
            }

            // Generate Arabic Audio
            if (!sahabi.audioFiles.arabic && sahabi.longBiographyArabic) {
                console.log(`Generating Arabic audio for ${sahabi.name}...`);
                try {
                    let attempts = 0;
                    let audioData = null;
                    while (!audioData && attempts < 3) {
                        try {
                            // Using "Charon" (Male) for Arabic variety, or "Puck". 
                            // Let's stick to "Aoede" for consistency or "Charon" for male. 
                            // The user didn't specify. Let's use "Charon" for Arabic to distinguish? 
                            // Or keep Aoede. Let's try Aoede first as it's tested.
                            audioData = await generateAudio(sahabi.longBiographyArabic, "Aoede");
                        } catch (err) {
                            if (err.message === 'RATE_LIMIT') {
                                console.log('Rate limit (Arabic). Waiting 60s...');
                                await new Promise(r => setTimeout(r, 60000));
                            } else {
                                throw err;
                            }
                            attempts++;
                        }
                    }

                    if (audioData) {
                        const fileName = `${slug}-ar.mp3`;
                        fs.writeFileSync(path.join(AUDIO_DIR, fileName), audioData);
                        sahabi.audioFiles.arabic = `audio/${fileName}`;
                        updated = true;
                        console.log(`✅ Saved ${fileName}`);
                        await new Promise(r => setTimeout(r, DELAY_MS));
                    }
                } catch (err) {
                    console.error(`❌ Failed Arabic audio for ${sahabi.name}:`, err.message);
                }
            }

            // Periodically save to avoid losing progress
            if (updated) {
                fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
                updated = false; // Reset flag after save
            }
        }

        console.log('Audio generation process complete.');

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
