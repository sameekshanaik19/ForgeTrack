const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\SAMEEKSHA NAIK\\Downloads\\Data Engineering and AI - Actual Program.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("--- RAW DATA (First 10 rows) ---");
    data.slice(0, 10).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });

    // Smart detection logic simulation
    let headerIdx = 0;
    while (headerIdx < data.length && (!data[headerIdx] || data[headerIdx].length < 2)) {
        headerIdx++;
    }

    console.log("\n--- DETECTED HEADERS (Row " + headerIdx + ") ---");
    console.log(JSON.stringify(data[headerIdx]));

} catch (err) {
    console.error("Error reading file:", err.message);
}
