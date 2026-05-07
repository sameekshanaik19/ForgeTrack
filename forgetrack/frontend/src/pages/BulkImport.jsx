import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Database,
  Calendar,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { analyzeSpreadsheetStructure, suggestMissingDates } from '../lib/gemini';

export function BulkImport() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Select Sheet, 3: AI Analysis, 4: Review, 5: Done
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [missingDates, setMissingDates] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState("");
  const [importStatus, setImportStatus] = useState({ success: 0, total: 0 });

  // Step 1: Handle File Upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const wb = XLSX.read(data, { type: 'binary' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setFile(uploadedFile);
      setStep(2);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // Step 2: Handle Sheet Selection
  const handleSheetSelect = async (sheetName) => {
    setSelectedSheet(sheetName);
    setLoading(true);
    setStep(3);

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find the first non-empty row to use as headers
    let headerRowIdx = 0;
    while (headerRowIdx < data.length && (!data[headerRowIdx] || data[headerRowIdx].length === 0)) {
      headerRowIdx++;
    }

    if (headerRowIdx >= data.length) {
      alert("This sheet appears to be empty.");
      setStep(2);
      setLoading(false);
      return;
    }

    const headers = data[headerRowIdx];
    const samples = data.slice(headerRowIdx + 1, headerRowIdx + 4);
    setSheetData(data.slice(headerRowIdx)); // Keep only data from header onwards

    console.log("Detected Headers at row", headerRowIdx, ":", headers);

    try {
      const result = await analyzeSpreadsheetStructure(headers, samples);
      setAiResult(result);
      
      // Check for missing dates in AI sessions
      const missing = result.sessions.filter(s => !s.date || s.date === "null");
      setMissingDates(missing);

      // Check for duplicates in Supabase
      const datesToCheck = result.sessions.map(s => s.date).filter(d => d && d !== "null");
      if (datesToCheck.length > 0) {
        const { data: existingSessions } = await supabase
          .from('sessions')
          .select('date')
          .in('date', datesToCheck);
        
        setDuplicates(existingSessions?.map(s => s.date) || []);
      }

      setStep(4);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      alert(`AI failed to analyze the sheet: ${error.message}. Please try another sheet or check your API key.`);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Handle Date Suggestion Logic
  const suggestDates = async () => {
    if (!weeklySchedule) return;
    setLoading(true);
    try {
      const updatedSessions = await suggestMissingDates(aiResult.sessions, weeklySchedule);
      setAiResult(prev => ({ ...prev, sessions: updatedSessions }));
      setMissingDates([]);
    } catch (error) {
      console.error("Date suggestion failed:", error);
      alert("AI failed to suggest dates. Please try describing the schedule differently.");
    } finally {
      setLoading(false);
    }
  };

  // Final Import Step
  const handleImport = async () => {
    setLoading(true);
    try {
      // 1. Identify Students
      const headers = sheetData[0];
      
      const getIndex = (col) => {
        if (typeof col === 'number') return col;
        const idx = headers.indexOf(col);
        return idx !== -1 ? idx : parseInt(col);
      };

      const nameIdx = getIndex(aiResult.mapping.name_column);
      const usnIdx = getIndex(aiResult.mapping.usn_column);
      const emailIdx = getIndex(aiResult.mapping.email_column);
      const branchIdx = getIndex(aiResult.mapping.branch_column || 'branch_code');

      console.log("Indices:", { nameIdx, usnIdx, emailIdx, branchIdx });

      const studentsToUpsert = sheetData.slice(1)
        .filter(row => {
          const name = row[nameIdx];
          const usn = row[usnIdx];
          return name && usn && String(name).trim() !== "" && String(usn).trim() !== "";
        })
        .map(row => ({
          name: String(row[nameIdx]).trim(),
          usn: String(row[usnIdx]).trim(),
          email: row[emailIdx] ? String(row[emailIdx]).trim() : `${String(row[usnIdx]).trim()}@forge.local`,
          branch_code: row[branchIdx] ? String(row[branchIdx]).trim() : 'CS'
        }));

      console.log(`Cleaned data: ${studentsToUpsert.length} valid students out of ${sheetData.length - 1} rows`);
      
      if (studentsToUpsert.length === 0) {
        throw new Error("No valid student records found. Please check if the Name and USN columns are correctly mapped.");
      }

      const { data: students, error: sError } = await supabase
        .from('students')
        .upsert(studentsToUpsert, { onConflict: 'usn' })
        .select();

      if (sError) throw sError;

      // 2. Create Sessions
      const sessionsToCreate = aiResult.sessions
        .filter(s => !duplicates.includes(s.date) && s.date && s.date !== "null")
        .map(s => ({
          date: s.date,
          topic: `Imported: ${s.original_header}`,
          month_number: new Date(s.date).getMonth() + 1
        }));

      if (sessionsToCreate.length > 0) {
        await supabase.from('sessions').insert(sessionsToCreate);
      }

      // 3. Re-fetch all sessions to get IDs
      const { data: allSessions } = await supabase.from('sessions').select('*');

      // 4. Build Attendance Records
      const attendanceRecords = [];
      aiResult.sessions.forEach(sessionMeta => {
        const session = allSessions.find(s => s.date === sessionMeta.date);
        if (!session) return;

        const colIdx = getIndex(sessionMeta.column);
        sheetData.slice(1).forEach(row => {
          const studentUsn = String(row[usnIdx]).trim();
          const student = students.find(s => s.usn === studentUsn);
          if (!student) return;

          const val = row[colIdx];
          const isPresent = val === true || 
                            String(val).toLowerCase() === 'true' || 
                            val === 1 || 
                            String(val).toLowerCase() === 'present' ||
                            String(val).toLowerCase() === 'p';
          
          attendanceRecords.push({
            student_id: student.id,
            session_id: session.id,
            present: isPresent,
            marked_by: 'AI Bulk Import'
          });
        });
      });

      // Batch upsert attendance
      const { error: aError } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { onConflict: 'student_id, session_id' });

      if (aError) throw aError;

      setImportStatus({ 
        success: attendanceRecords.length, 
        students: students.length,
        total: attendanceRecords.length 
      });
      setStep(5);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12">
      <header className="mb-12">
        <h1 className="text-h1 mb-2">Bulk Attendance Import</h1>
        <p className="text-body text-[var(--text-secondary)]">Use AI to automatically map and import attendance from spreadsheets.</p>
      </header>

      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-12">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm transition-colors ${
              step === s ? 'bg-[var(--accent-glow)] text-white' : 
              step > s ? 'bg-[var(--success-fg)] text-white' : 'bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)]'
            }`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 5 && <div className={`w-12 h-[2px] ${step > s ? 'bg-[var(--success-fg)]' : 'bg-[var(--border-subtle)]'}`}></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="card py-24 flex flex-col items-center justify-center border-dashed border-2 border-[var(--border-strong)] bg-transparent hover:border-[var(--accent-glow)] transition-colors group cursor-pointer relative">
          <input 
            type="file" 
            accept=".csv,.xlsx,.xls" 
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-20 h-20 rounded-full bg-[var(--bg-surface-inset)] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-[var(--text-tertiary)] group-hover:text-[var(--accent-glow)] transition-colors" />
          </div>
          <h2 className="text-h2 mb-2">Drop your spreadsheet here</h2>
          <p className="text-body text-[var(--text-secondary)]">Supports .csv, .xlsx, and .xls files</p>
        </div>
      )}

      {/* Step 2: Select Sheet */}
      {step === 2 && (
        <div className="card">
          <div className="flex items-center gap-4 mb-8">
            <FileSpreadsheet className="w-8 h-8 text-[var(--accent-glow)]" />
            <div>
              <h2 className="text-h2">Select Sheet</h2>
              <p className="text-body text-[var(--text-secondary)]">We found {sheetNames.length} sheets. Choose the one containing attendance data.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sheetNames.map(name => (
              <button 
                key={name}
                onClick={() => handleSheetSelect(name)}
                className="flex items-center justify-between p-6 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-default)] hover:border-[var(--accent-glow)] transition-all group"
              >
                <span className="text-body-lg font-medium">{name}</span>
                <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: AI Analysis */}
      {step === 3 && (
        <div className="card py-24 flex flex-col items-center justify-center text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-[var(--accent-glow-soft)] border-t-[var(--accent-glow)] animate-spin"></div>
            <Database className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-[var(--accent-glow)]" />
          </div>
          <h2 className="text-h2 mb-2">AI is analyzing your data...</h2>
          <p className="text-body text-[var(--text-secondary)] max-w-sm">
            Our agent is reasoning about the columns to identify students and session dates.
          </p>
        </div>
      )}

      {/* Step 4: Review & Mapping */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* Field Mapping */}
            <div className="card">
              <div className="flex items-center gap-3 mb-8">
                <UserCheck className="w-6 h-6 text-[var(--accent-glow)]" />
                <h3 className="text-h3 font-display">Student Fields</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Name', value: aiResult.mapping.name_column },
                  { label: 'USN/ID', value: aiResult.mapping.usn_column },
                  { label: 'Email', value: aiResult.mapping.email_column },
                ].map((field, i) => (
                  <div key={i} className="flex flex-col gap-1 p-4 rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                    <span className="text-micro text-[var(--text-tertiary)] uppercase">{field.label}</span>
                    <span className="text-body font-medium">{field.value || 'Not found'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions Found */}
            <div className="card">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-[var(--accent-glow)]" />
                  <h3 className="text-h3 font-display">Sessions Identified</h3>
                </div>
                <span className="pill pill-neutral">{aiResult.sessions.length} Found</span>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {aiResult.sessions.map((session, i) => {
                  const isDup = duplicates.includes(session.date);
                  const isMissing = !session.date || session.date === "null";
                  
                  return (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isDup ? 'bg-[var(--danger-bg-soft)] border-[var(--danger-border)]' : 
                      isMissing ? 'bg-[var(--warning-bg-soft)] border-[var(--warning-border)]' : 
                      'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)]'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-body font-medium">{session.original_header}</span>
                        <span className="text-caption text-[var(--text-tertiary)]">Mapped Date: {session.date || "Unknown"}</span>
                      </div>
                      {isDup ? (
                        <div className="flex items-center gap-2 text-[var(--danger-fg)] text-caption font-medium">
                          <AlertCircle className="w-4 h-4" /> Already in DB
                        </div>
                      ) : isMissing ? (
                        <div className="flex items-center gap-2 text-[var(--warning-fg)] text-caption font-medium">
                          <AlertCircle className="w-4 h-4" /> Missing Date
                        </div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-[var(--success-fg)]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gap Filling (Missing Dates) */}
          {missingDates.length > 0 && (
            <div className="card bg-[var(--warning-bg-soft)] border-[var(--warning-border)]">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-[var(--warning-fg)] shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-h3 font-display text-[var(--warning-fg)] mb-2">Resolve Missing Dates</h3>
                  <p className="text-body text-[var(--text-secondary)] mb-6">
                    Some columns don't have dates in the header. Tell us the weekly class schedule to help AI suggest dates.
                  </p>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="e.g. Tuesdays and Thursdays" 
                      value={weeklySchedule}
                      onChange={(e) => setWeeklySchedule(e.target.value)}
                      className="flex-1 bg-[var(--bg-surface-raised)] border border-[var(--warning-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--warning-fg)]"
                    />
                    <button 
                      onClick={suggestDates}
                      className="bg-[var(--warning-fg)] text-white px-6 py-3 rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity"
                    >
                      Suggest Dates
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="card bg-[var(--danger-bg-soft)] border-[var(--danger-border)]">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-[var(--danger-fg)]" />
                <p className="text-body font-medium text-[var(--danger-fg)]">
                  We found {duplicates.length} duplicate sessions. These will be skipped or updated to avoid double entries.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <button 
              onClick={() => setStep(2)}
              className="bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-8 py-4 font-medium hover:bg-[var(--bg-surface-inset)] transition-colors"
            >
              Back
            </button>
            <button 
              onClick={handleImport}
              disabled={loading || missingDates.length > 0}
              className="bg-[var(--accent-glow)] text-white rounded-[var(--radius-md)] px-12 py-4 font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Start Import
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <div className="card py-24 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-[var(--success-bg-soft)] flex items-center justify-center mb-8">
            <CheckCircle2 className="w-12 h-12 text-[var(--success-fg)]" />
          </div>
          <h2 className="text-h2 mb-2">Import Successful!</h2>
          <p className="text-body text-[var(--text-secondary)] mb-12 max-w-md">
            Successfully imported {importStatus.students} students and {importStatus.success} attendance records across {aiResult.sessions.length} sessions.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-[var(--radius-md)] px-12 py-4 font-bold hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
