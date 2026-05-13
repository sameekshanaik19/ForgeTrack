import XLSX from 'xlsx';

const filePath = 'c:\\Users\\SAMEEKSHA NAIK\\Downloads\\Data Engineering and AI - Actual Program.xlsx';

function analyze() {
  const workbook = XLSX.readFile(filePath);
  console.log('Workbook Sheets:', workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Header Row (Row 0):', data[0]);
    if (data[1]) console.log('Sample Data Row (Row 1):', data[1]);
  });
}

analyze();
