const https = require('https');

const API_KEY = process.argv[2];

if (!API_KEY) {
    console.error('Please provide your Gemini API Key as an argument.');
    process.exit(1);
}

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${API_KEY}`,
    method: 'GET',
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
            } else {
                console.log('Error/Response:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.end();
