import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import RegsBot from './pages/agents/RegsBot'
import RequirementsBot from './pages/agents/RequirementsBot'
import FigmaBot from './pages/agents/FigmaBot'
import TestingBot from './pages/agents/TestingBot'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="agents">
          <Route path="regs" element={<RegsBot />} />
          <Route path="requirements" element={<RequirementsBot />} />
          <Route path="figma" element={<FigmaBot />} />
          <Route path="testing" element={<TestingBot />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
