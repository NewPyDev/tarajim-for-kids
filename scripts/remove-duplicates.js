const fs = require('fs');
const path = require('path');

const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');

try {
    const rawData = fs.readFileSync(SAHABA_FILE, 'utf8');
    const data = JSON.parse(rawData);

    // IDs to remove
    const idsToRemove = [32, 33];

    const initialCount = data.sahaba.length;
    data.sahaba = data.sahaba.filter(s => !idsToRemove.includes(s.id));
    const finalCount = data.sahaba.length;

    if (initialCount === finalCount) {
        console.log('No duplicates found/removed.');
    } else {
        console.log(`Removed ${initialCount - finalCount} duplicate entries.`);
        fs.writeFileSync(SAHABA_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('Successfully updated sahaba.json');
    }

} catch (err) {
    console.error('Error:', err);
}
