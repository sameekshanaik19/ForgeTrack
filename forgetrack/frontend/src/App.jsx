import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { MarkAttendance } from './pages/MarkAttendance'
import { StudentHistory } from './pages/StudentHistory'
import { Materials } from './pages/Materials'
import { BulkImport } from './pages/BulkImport'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Authenticated Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/materials" element={<Materials />} />
        
        {/* Mentor Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['mentor']}><OutletWithContext /></ProtectedRoute>}>
          <Route path="/attendance" element={<MarkAttendance />} />
          <Route path="/import" element={<BulkImport />} />
        </Route>

        {/* Routes available to both or specific roles */}
        <Route path="/history" element={<StudentHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// Small helper to allow nesting ProtectedRoute inside another Route
import { Outlet } from 'react-router-dom'
function OutletWithContext() {
  return <Outlet />
}

export default App
