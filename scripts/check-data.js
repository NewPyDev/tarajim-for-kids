const fs = require('fs');
const path = require('path');

const sahaba = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/sahaba.json'), 'utf8')).sahaba;

console.log('Checking Sahaba Data...');
console.log('Total Sahaba:', sahaba.length);

let missingCount = 0;

const report = sahaba.map(s => {
    const missing = [];
    if (!s.nameArabic) missing.push('nameArabic');
    if (!s.longBiographyArabic) missing.push('longBiographyArabic');
    if (!s.keyLessonsArabic || s.keyLessonsArabic.length === 0) missing.push('keyLessonsArabic');
    if (!s.timelineArabic || s.timelineArabic.length === 0) missing.push('timelineArabic');
    if (!s.descriptionArabic) missing.push('descriptionArabic');

    if (missing.length > 0) {
        // console.log(`[${s.id}] ${s.name} (${s.slug}): Missing ${missing.join(', ')}`);
        if (missing.includes('longBiographyArabic')) missingCount++;
    }
    return { id: s.id, name: s.name, slug: s.slug, missing };
});

const withMissing = report.filter(r => r.missing.length > 0);
fs.writeFileSync(path.join(__dirname, 'missing_report.json'), JSON.stringify(withMissing, null, 2));
console.log('Report saved to missing_report.json');

