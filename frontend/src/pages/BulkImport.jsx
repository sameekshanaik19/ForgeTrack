import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Database,
  Calendar,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export function BulkImport() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Columns, 3: Success
  const [loading, setLoading] = useState(false);
  const [workbook, setWorkbook] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [mapping, setMapping] = useState({ name: -1, usn: -1, email: -1 });
  const [importStatus, setImportStatus] = useState({ success: 0, students: 0 });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const wb = XLSX.read(data, { type: 'binary' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      // ── STEP 3: Aggressive Header Search ──
      const keywords = ['name', 'usn', 'roll', 'id', 'student', 'sl no', 's.no'];
      let headerIdx = -1;
      
      for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        const row = rawData[i] || [];
        const hasKeyword = row.some(cell => 
          cell && keywords.some(k => String(cell).toLowerCase().includes(k))
        );
        if (hasKeyword) {
          headerIdx = i;
          break;
        }
      }

      // Fallback to first non-empty row
      if (headerIdx === -1) {
        headerIdx = 0;
        while (headerIdx < rawData.length && (!rawData[headerIdx] || rawData[headerIdx].length < 2)) {
          headerIdx++;
        }
      }

      if (headerIdx >= rawData.length || !rawData[headerIdx]) {
        alert("Could not find a valid header row. Please make sure your sheet has columns like 'Name' and 'USN'.");
        return;
      }

      setWorkbook(wb);
      setSheetData(rawData.slice(headerIdx));
      
      // Keep Row 1 (Day X info) if available
      const sessionLabels = headerIdx > 0 ? (rawData[headerIdx - 1] || []) : [];
      setWorkbook({ ...wb, sessionLabels }); // Temporary store in state
      
      // Auto-guess mapping
      const headers = rawData[headerIdx] || [];
      const newMapping = { name: -1, usn: -1, email: -1 };
      headers.forEach((h, i) => {
        const str = String(h).toLowerCase().trim();
        if (str.includes('name') || str.includes('student')) newMapping.name = i;
        if (str.includes('usn') || str.includes('id') || str.includes('roll') || str.includes('reg')) newMapping.usn = i;
        if (str.includes('email') || str.includes('mail')) newMapping.email = i;
      });
      
      // If we still haven't found USN, check the first few data rows for USN patterns
      if (newMapping.usn === -1) {
        for (let i = 1; i < 5 && i < rawData.length; i++) {
          const row = rawData[headerIdx + i] || [];
          const usnCol = row.findIndex(cell => /^[a-zA-Z0-9]{10}$/.test(String(cell)));
          if (usnCol !== -1) {
            newMapping.usn = usnCol;
            break;
          }
        }
      }
      setMapping(newMapping);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (mapping.name === -1 || mapping.usn === -1) {
      alert("Please map both Name and USN columns.");
      return;
    }

    setLoading(true);
    try {
      const headers = sheetData[0];
      const rows = sheetData.slice(1);
      
      // 1. Identify Session Columns
      const sessionCols = [];
      const sessionLabels = workbook?.sessionLabels || [];
      
      headers.forEach((h, i) => {
        const str = String(h).trim().toLowerCase();
        // Check for "Attendance" columns
        if (str === 'attendance') {
          // Look for "Day X" in the row above, or fallback to index
          const label = String(sessionLabels[i] || `Session ${sessionCols.length + 1}`).trim();
          sessionCols.push({ index: i, header: label });
        } else if (/\d{1,2}[\/\-]\d{1,2}/.test(str) || !isNaN(Date.parse(str))) {
          // Standard date-based headers
          sessionCols.push({ index: i, header: str });
        }
      });

      // Find branch_code and admission_number indexes
      const branchIdx = headers.findIndex(h => String(h).toLowerCase().includes('branch'));
      const admIdx = headers.findIndex(h => String(h).toLowerCase().includes('admission'));

      // 2. Build Students
      const students = rows
        .filter(row => row[mapping.name] && row[mapping.usn])
        .map(row => ({
          name: String(row[mapping.name]).trim(),
          usn: String(row[mapping.usn]).trim().toUpperCase(),
          email: mapping.email >= 0 && row[mapping.email] 
            ? String(row[mapping.email]).trim().toLowerCase() 
            : `${String(row[mapping.usn]).trim().toLowerCase()}@forge.local`,
          admission_number: admIdx >= 0 ? String(row[admIdx] || '').trim() : null,
          branch_code: branchIdx >= 0 ? String(row[branchIdx] || 'DE').trim() : 'DE',
          is_active: true
        }));

      // Deduplicate students
      const uniqueStudents = Array.from(new Map(students.map(s => [s.usn, s])).values());

      // 3. Build Sessions
      const sessions = sessionCols.map((col, idx) => {
        let dateStr = col.header;
        // Try to normalize date
        const parsed = Date.parse(dateStr);
        if (!isNaN(parsed)) {
          dateStr = new Date(parsed).toISOString().split('T')[0];
        } else {
          // Create synthetic date starting from today backwards or forwards
          // Since the sheet has "Day 1, Day 2", let's assign them unique dates
          const d = new Date();
          d.setDate(d.getDate() - (sessionCols.length - idx));
          dateStr = d.toISOString().split('T')[0];
        }
        return { date: dateStr, topic: col.header, index: col.index };
      }).filter(s => s.date && s.date !== 'Invalid Date');

      // 4. Save to Database
      // Students
      const { error: sErr } = await supabase.from('students').insert(uniqueStudents);
      if (sErr) throw sErr;

      // Sessions
      const dbSessions = sessions.map(s => {
        const dateObj = new Date(s.date);
        return { 
          date: s.date, 
          topic: s.topic,
          month_number: isNaN(dateObj.getMonth()) ? 1 : dateObj.getMonth() + 1
        };
      });
      const { error: sessErr } = await supabase.from('sessions').insert(dbSessions);
      if (sessErr) throw sessErr;

      // Attendance
      const { data: dbStudents } = await supabase.from('students').select('id, usn');
      const { data: dbSessionsFull } = await supabase.from('sessions').select('id, date');

      if (dbStudents && dbSessionsFull) {
        const attendanceRecords = [];
        sessions.forEach(sessionMeta => {
          const dbSess = dbSessionsFull.find(s => s.date === sessionMeta.date);
          if (!dbSess) return;

          rows.forEach(row => {
            const usn = String(row[mapping.usn] || '').trim().toUpperCase();
            if (!usn) return;
            const dbStu = dbStudents.find(s => s.usn === usn);
            if (!dbStu) return;

            const val = String(row[sessionMeta.index] || '').toLowerCase().trim();
            const isPresent = val === '1' || val === 'p' || val === 'present' || val === 'yes' || val === 'true';
            
            attendanceRecords.push({
              student_id: dbStu.id,
              session_id: dbSess.id,
              present: isPresent,
              marked_by: 'Bulk Import'
            });
          });
        });

        // Batch upsert attendance (1000 records at a time)
        const chunkSize = 1000;
        for (let i = 0; i < attendanceRecords.length; i += chunkSize) {
          const chunk = attendanceRecords.slice(i, i + chunkSize);
          const { error: attErr } = await supabase.from('attendance').insert(chunk);
          if (attErr) throw attErr;
        }
      }

      // Save locally as well for instant dashboard update
      localStorage.setItem('forge_import_completed', 'true');
      localStorage.setItem('forge_dashboard_stats', JSON.stringify({
        totalSessions: sessions.length,
        activeStudents: uniqueStudents.length,
        attendanceRate: 0, // Will be recalculated by dashboard
        importedAt: new Date().toISOString()
      }));
      localStorage.setItem('forge_students', JSON.stringify(uniqueStudents));

      setImportStatus({ success: sessions.length, students: uniqueStudents.length });
      setStep(3);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      <h1 className="text-display-md mb-8">Bulk Import</h1>

      {step === 1 && (
        <div className="card py-24 flex flex-col items-center justify-center border-dashed border-2 border-[var(--border-strong)]">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload className="w-12 h-12 mb-4 text-[var(--text-tertiary)]" />
          <h2 className="text-h2">Upload Attendance Spreadsheet</h2>
          <p className="text-body text-[var(--text-secondary)] mt-2">Click or drag your file here</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="card">
            <h3 className="text-h3 mb-6">Map Your Columns</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Name Column', key: 'name' },
                { label: 'USN/ID Column', key: 'usn' },
                { label: 'Email Column (Optional)', key: 'email' },
              ].map(field => (
                <div key={field.key} className="flex flex-col gap-2">
                  <label className="text-micro font-bold text-[var(--text-secondary)]">{field.label}</label>
                  <select 
                    value={mapping[field.key]} 
                    onChange={(e) => setMapping({...mapping, [field.key]: parseInt(e.target.value)})}
                    className={`bg-[var(--bg-surface-inset)] border p-3 rounded-lg text-sm focus:outline-none transition-colors ${
                      field.key !== 'email' && mapping[field.key] === -1 
                        ? 'border-[var(--danger-fg)] shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                        : 'border-[var(--border-default)]'
                    }`}
                  >
                    <option value={-1}>Select Column...</option>
                    {sheetData[0].map((h, i) => (
                      <option key={i} value={i}>{h || `Column ${i+1}`}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h3 className="text-h3 mb-4">Data Preview</h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr>
                  {sheetData[0].map((h, i) => (
                    <th key={i} className="p-2 border-b border-[var(--border-subtle)] font-bold truncate max-w-[150px]">
                      {h || `Column ${i+1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData.slice(1, 6).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="p-2 border-b border-[var(--border-subtle)] text-[var(--text-secondary)] truncate max-w-[150px]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={() => setStep(1)} className="px-8 py-3 rounded-lg border border-[var(--border-default)]">Back</button>
            <button 
              onClick={handleImport} 
              disabled={loading}
              className={`px-12 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                mapping.name === -1 || mapping.usn === -1 
                  ? 'bg-[var(--border-strong)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50' 
                  : 'bg-[var(--accent-glow)] text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              }`}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              {mapping.name === -1 || mapping.usn === -1 ? 'Map Required Columns' : 'Start Import'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card py-24 flex flex-col items-center text-center">
          <CheckCircle2 className="w-16 h-16 text-[var(--success-fg)] mb-6" />
          <h2 className="text-h2 mb-2">Import Successful!</h2>
          <p className="text-body text-[var(--text-secondary)] mb-12">
            Imported {importStatus.students} students and {importStatus.success} sessions.
          </p>
          <button onClick={() => navigate('/dashboard')} className="bg-[var(--text-primary)] text-[var(--bg-void)] px-12 py-4 rounded-lg font-bold">
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
