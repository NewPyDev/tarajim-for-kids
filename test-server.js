// Simple test script to verify server functionality
const http = require('http');

function testEndpoint(path, expectedStatus = 200) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`${path}: ${res.statusCode} ${res.statusCode === expectedStatus ? '✓' : '✗'}`);
            resolve(res.statusCode === expectedStatus);
        });

        req.on('error', (err) => {
            console.log(`${path}: ERROR - ${err.message}`);
            reject(err);
        });

        req.end();
    });
}

async function runTests() {
    console.log('Testing server endpoints...\n');
    
    try {
        await testEndpoint('/');
        await testEndpoint('/public/');
        await testEndpoint('/api/sahaba/public');
        await testEndpoint('/admin/login.html');
        await testEndpoint('/nonexistent', 404);
        
        console.log('\nAll tests completed!');
    } catch (error) {
        console.log('Server might not be running. Start it with: npm start');
    }
}

runTests();