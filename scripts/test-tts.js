const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.argv[2];
const OUTPUT_FILE = path.join(__dirname, 'test-audio.mp3');

if (!API_KEY) {
    console.error('Usage: node scripts/test-tts.js <YOUR_API_KEY>');
    process.exit(1);
}

const textToSpeak = "System check. One two.";
const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: textToSpeak }] }],
    generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Aoede" }
            }
        }
    }
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    // Trying generateContent first
    path: `/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
    }
};

console.log('Sending request to Gemini TTS...');

const req = https.request(options, (res) => {
    let data = [];
    res.on('data', chunk => data.push(chunk));
    res.on('end', () => {
        const buffer = Buffer.concat(data);
        const responseString = buffer.toString();

        try {
            const json = JSON.parse(responseString);

            if (res.statusCode !== 200) {
                console.error('Error Response:', JSON.stringify(json, null, 2));
                return;
            }

            // Check if we got audio data in the response
            // Looking for inlineData or similar
            const candidate = json.candidates?.[0];
            const parts = candidate?.content?.parts;

            if (parts && parts.length > 0) {
                // Check if any part is audio
                const audioPart = parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('audio'));

                if (audioPart) {
                    const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
                    fs.writeFileSync(OUTPUT_FILE, audioBuffer);
                    console.log(`Success! Audio saved to ${OUTPUT_FILE}`);
                    console.log(`Size: ${audioBuffer.length} bytes`);
                } else {
                    console.log('No audio part found. Response parts:', JSON.stringify(parts, null, 2));
                }
            } else {
                console.log('No candidates/parts found.', JSON.stringify(json, null, 2));
            }

        } catch (e) {
            console.error('Failed to parse response:', e);
            console.log('Raw response:', responseString);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.write(requestBody);
req.end();
