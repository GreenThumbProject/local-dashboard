import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard   from './pages/Dashboard'
import Graphs      from './pages/Graphs'
import Thresholds  from './pages/Thresholds'
import Settings    from './pages/Settings'
import Cultivation from './pages/Cultivation'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index          element={<Dashboard />} />
        <Route path="graphs"      element={<Graphs />} />
        <Route path="thresholds"  element={<Thresholds />} />
        <Route path="settings"    element={<Settings />} />
        <Route path="cultivation" element={<Cultivation />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
