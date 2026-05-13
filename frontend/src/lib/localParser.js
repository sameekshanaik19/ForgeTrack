/**
 * Smart local spreadsheet parser — no AI/API key required.
 * Aggressively detects name, USN, email columns and date-based session columns.
 */

function parseIndianDate(str) {
  if (!str) return null;
  const s = String(str).trim();

  // Full DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // Short DD/MM (assume 2025)
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const [, d, mo] = m;
    const year = parseInt(mo) <= 4 ? 2025 : 2024; // Jan-Apr=2025, else 2024
    return `${year}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // Already ISO
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;

  return null;
}

function isDateHeader(header) {
  if (!header) return false;
  const h = String(header).trim();
  if (parseIndianDate(h)) return true;
  if (/^(session|class|day|date|s\.no|sno|sl)\s*\d*/i.test(h)) return false; // Exclude serial numbers
  if (/\d{1,2}[\/\-]\d{1,2}/.test(h)) return true; // Contains date pattern
  return false;
}

function isUSN(value) {
  if (!value) return false;
  // Common Indian USN patterns: 1XX21CS001, 4SF21CS001, etc.
  return /^[1-9][A-Za-z0-9]{2}\d{2}[A-Za-z]{2}\d{3}$/.test(String(value).trim());
}

function detectColumn(headers, sampleRows, keywords, validator) {
  const h = headers.map(x => String(x || '').toLowerCase().trim());
  
  // 1. Keyword match in headers
  for (const kw of keywords) {
    const idx = h.findIndex(col => col.includes(kw));
    if (idx !== -1) return idx;
  }

  // 2. Validate using sample data
  if (validator && sampleRows.length > 0) {
    for (let col = 0; col < headers.length; col++) {
      const values = sampleRows.map(r => r[col]).filter(Boolean);
      if (values.some(v => validator(v))) return col;
    }
  }

  return -1;
}

export function analyzeSpreadsheetLocally(headers, sampleRows) {
  // Detect USN column first (most reliable)
  let usnIdx = detectColumn(headers, sampleRows, 
    ['usn', 'roll', 'roll no', 'rollno', 'reg no', 'regno', 'student id', 'id', 'enrollment', 'htno', 'ht no'],
    isUSN
  );

  // Detect name column
  let nameIdx = detectColumn(headers, sampleRows,
    ['name', 'student name', 'full name', 'naam', 'sname', 's.name'],
    null
  );

  // Detect email column
  let emailIdx = detectColumn(headers, sampleRows,
    ['email', 'mail', 'e-mail', 'email id'],
    v => String(v).includes('@')
  );

  // Detect branch column
  let branchIdx = detectColumn(headers, sampleRows,
    ['branch', 'dept', 'department', 'stream', 'course'],
    null
  );

  // Fallback: if USN not found, look for a column with USN-like values in sample data
  if (usnIdx === -1 && sampleRows.length > 0) {
    for (let col = 0; col < (headers.length || 20); col++) {
      const vals = sampleRows.map(r => r[col]).filter(Boolean);
      if (vals.some(v => /^[1-9][A-Za-z0-9]{2}\d{2}/.test(String(v).trim()))) {
        usnIdx = col;
        break;
      }
    }
  }

  // Fallback: if name not found, use first non-date, non-USN, non-email text column
  if (nameIdx === -1) {
    for (let col = 0; col < headers.length; col++) {
      if (col === usnIdx || col === emailIdx || col === branchIdx) continue;
      if (isDateHeader(headers[col])) continue;
      const vals = sampleRows.map(r => r[col]).filter(Boolean);
      // Name columns have text values that aren't numbers or 0/1
      if (vals.some(v => /[a-zA-Z]{3,}/.test(String(v)) && !isUSN(v))) {
        nameIdx = col;
        break;
      }
    }
  }

  // Last resort fallback
  if (nameIdx === -1) nameIdx = 0;
  if (usnIdx === -1) usnIdx = nameIdx === 0 ? 1 : 0;

  // Detect session columns (columns with dates or attendance values)
  const sessions = [];
  const nonDataCols = new Set([nameIdx, usnIdx, emailIdx, branchIdx].filter(i => i >= 0));

  headers.forEach((h, idx) => {
    if (nonDataCols.has(idx)) return;
    const hStr = String(h || '').trim();
    const date = parseIndianDate(hStr);
    
    // Check if column contains attendance-like values (0/1, P/A, etc.)
    const colVals = sampleRows.map(r => r[idx]).filter(v => v !== null && v !== undefined && v !== '');
    const isAttendanceCol = colVals.some(v => {
      const s = String(v).toLowerCase().trim();
      return ['0', '1', 'p', 'a', 'present', 'absent', 'y', 'n'].includes(s) || v === 0 || v === 1;
    });

    if (date || (isAttendanceCol && !isDateHeader(hStr))) {
      sessions.push({
        column: idx,
        date: date || null,
        original_header: hStr
      });
    }
  });

  console.log('LocalParser detected:', { nameIdx, usnIdx, emailIdx, branchIdx, sessions: sessions.length });

  return {
    mapping: {
      name_column: nameIdx,
      usn_column: usnIdx,
      email_column: emailIdx,
      branch_column: branchIdx,
    },
    sessions
  };
}

export function suggestMissingDatesLocally(sessions) {
  const scheduleDays = [3, 4, 6]; // Wed, Thu, Sat

  const known = sessions
    .filter(s => s.date)
    .map(s => new Date(s.date + 'T00:00:00'));

  const startAnchor = known.length > 0 
    ? new Date(Math.min(...known.map(d => d.getTime())))
    : new Date('2024-09-04T00:00:00');

  // Go back to build valid dates list
  const cursor = new Date(startAnchor);
  cursor.setDate(cursor.getDate() - 90);
  cursor.setHours(0, 0, 0, 0);

  const validDates = [];
  for (let i = 0; i < 400; i++) {
    if (scheduleDays.includes(cursor.getDay())) {
      validDates.push(cursor.toISOString().split('T')[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const usedDates = new Set(sessions.filter(s => s.date).map(s => s.date));
  let seqIdx = 0;

  return sessions.map(s => {
    if (s.date) {
      const pos = validDates.indexOf(s.date);
      if (pos !== -1) seqIdx = pos + 1;
      return s;
    }
    // Find next unused valid date
    while (seqIdx < validDates.length && usedDates.has(validDates[seqIdx])) seqIdx++;
    const suggested = validDates[seqIdx] || null;
    if (suggested) { usedDates.add(suggested); seqIdx++; }
    return { ...s, date: suggested };
  });
}
