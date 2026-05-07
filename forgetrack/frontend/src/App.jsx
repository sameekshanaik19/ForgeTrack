import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { MarkAttendance } from './pages/MarkAttendance'
import { StudentHistory } from './pages/StudentHistory'
import { Materials } from './pages/Materials'
import { BulkImport } from './pages/BulkImport'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<MarkAttendance />} />
        <Route path="/history" element={<StudentHistory />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/import" element={<BulkImport />} />
      </Routes>
    </AppLayout>
  )
}

export default App
