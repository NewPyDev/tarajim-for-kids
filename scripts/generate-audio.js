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

const DELAY_MS = 2000;

// Helper to create WAV header
function createWavHeader(dataLength, sampleRate = 24000) {
    const buffer = Buffer.alloc(44);

    // RIFF identifier
    buffer.write('RIFF', 0);
    // file length
    buffer.writeUInt32LE(36 + dataLength, 4);
    // RIFF type
    buffer.write('WAVE', 8);
    // format chunk identifier
    buffer.write('fmt ', 12);
    // format chunk length
    buffer.writeUInt32LE(16, 16);
    // sample format (1 is PCM)
    buffer.writeUInt16LE(1, 20);
    // channels (1)
    buffer.writeUInt16LE(1, 22);
    // sample rate
    buffer.writeUInt32LE(sampleRate, 24);
    // byte rate (sampleRate * blockAlign)
    buffer.writeUInt32LE(sampleRate * 2, 28);
    // block align (channel count * bytes per sample)
    buffer.writeUInt16LE(2, 32);
    // bits per sample
    buffer.writeUInt16LE(16, 34);
    // data chunk identifier
    buffer.write('data', 36);
    // data chunk length
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}

async function generateAudio(text, voiceName = "Aoede") {
    // Remove HTML tags for TTS
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return null;

    // Check length.
    // REDUCED LIMIT TO 600 chars to be safe and avoid timeouts
    const CHUNK_LIMIT = 600;

    if (cleanText.length > CHUNK_LIMIT) {
        console.log(`Text too long (${cleanText.length} chars). Splitting...`);
        // Simple split by period to avoid cutting sentences. 
        const sentences = cleanText.match(/[^.!?]+[.!?]+(\s+|$)/g) || [cleanText];
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > (CHUNK_LIMIT - 100)) {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk);

        console.log(`Split into ${chunks.length} chunks.`);

        const audioBuffers = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            // Skip empty chunks
            if (!chunk.trim()) continue;

            console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);

            let attempts = 0;
            let success = false;

            while (!success && attempts < 5) {
                try {
                    const buffer = await generateAudio(chunk, voiceName); // Recursive call
                    if (buffer) {
                        audioBuffers.push(buffer);
                        console.log(`Chunk ${i + 1} done. Size: ${buffer.length}`);
                        success = true;
                        // Brief pause between chunks to be nice to API
                        await new Promise(r => setTimeout(r, 2000));
                    } else {
                        throw new Error("Returned buffer is empty/null");
                    }
                } catch (e) {
                    if (e.message === 'RATE_LIMIT' || e.message.includes('429')) {
                        console.error(`Chunk ${i + 1} RATE LIMITED. Waiting 60s... (Attempt ${attempts + 1}/5)`);
                        await new Promise(r => setTimeout(r, 60000));
                        // Retry
                    } else {
                        console.error(`Chunk ${i + 1} failed: ${e.message}. Retrying... (Attempt ${attempts + 1}/5)`);
                        await new Promise(r => setTimeout(r, 5000));
                    }
                    attempts++;
                }
            }
            if (!success) {
                console.error(`❌ Failed to process chunk ${i + 1} after 5 attempts. Skipping (this will cause audio gap).`);
            }
        }
        console.log(`All chunks done. Concatenating...`);
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
        },
        timeout: 60000 // 60 seconds timeout
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

        req.on('error', (e) => reject(new Error(`Request error: ${e.message}`)));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

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
            const wavFileNameEn = `${slug}-en.wav`;
            const wavPathEn = path.join(AUDIO_DIR, wavFileNameEn);

            // Re-check logic: if it exists, CHECK SIZE. If 44 bytes, it's failed. Regenerate.
            const existsEn = fs.existsSync(wavPathEn);
            const sizeEn = existsEn ? fs.statSync(wavPathEn).size : 0;

            if ((!existsEn || sizeEn < 1000) && sahabi.longBiography) {
                console.log(`Generating English audio for ${sahabi.name}...`);
                try {
                    let audioData = await generateAudio(sahabi.longBiography, "Aoede"); // Female voice

                    if (audioData) {
                        // Create WAV header
                        const header = createWavHeader(audioData.length);
                        const finalBuffer = Buffer.concat([header, audioData]);

                        fs.writeFileSync(wavPathEn, finalBuffer);
                        sahabi.audioFiles.english = `audio/${wavFileNameEn}`;
                        updated = true;
                        console.log(`✅ Saved ${wavFileNameEn} (${finalBuffer.length} bytes)`);
                        await new Promise(r => setTimeout(r, DELAY_MS));
                    }
                } catch (err) {
                    console.error(`❌ Failed English audio for ${sahabi.name}:`, err.message);
                }
            } else if (fs.existsSync(wavPathEn) && sizeEn > 1000) {
                if (sahabi.audioFiles.english !== `audio/${wavFileNameEn}`) {
                    sahabi.audioFiles.english = `audio/${wavFileNameEn}`;
                    updated = true;
                }
            }

            // Generate Arabic Audio
            const wavFileNameAr = `${slug}-ar.wav`;
            const wavPathAr = path.join(AUDIO_DIR, wavFileNameAr);

            const existsAr = fs.existsSync(wavPathAr);
            const sizeAr = existsAr ? fs.statSync(wavPathAr).size : 0;

            if ((!existsAr || sizeAr < 1000) && sahabi.longBiographyArabic) {
                console.log(`Generating Arabic audio for ${sahabi.name}...`);
                try {
                    let audioData = await generateAudio(sahabi.longBiographyArabic, "Aoede");

                    if (audioData) {
                        const header = createWavHeader(audioData.length);
                        const finalBuffer = Buffer.concat([header, audioData]);

                        fs.writeFileSync(wavPathAr, finalBuffer);
                        sahabi.audioFiles.arabic = `audio/${wavFileNameAr}`;
                        updated = true;
                        console.log(`✅ Saved ${wavFileNameAr} (${finalBuffer.length} bytes)`);
                        await new Promise(r => setTimeout(r, DELAY_MS));
                    }
                } catch (err) {
                    console.error(`❌ Failed Arabic audio for ${sahabi.name}:`, err.message);
                }
            } else if (fs.existsSync(wavPathAr) && sizeAr > 1000) {
                if (sahabi.audioFiles.arabic !== `audio/${wavFileNameAr}`) {
                    sahabi.audioFiles.arabic = `audio/${wavFileNameAr}`;
                    updated = true;
                }
            }

            // Periodically save
            if (updated) {
                fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
                updated = false;
            }
        }

        console.log('Audio generation process complete.');

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
