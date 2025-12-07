import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Council from './pages/Council'
import Dashboard from './pages/Dashboard'
import CopilotBot from './pages/agents/CopilotBot'
import DAHSBot from './pages/agents/DAHSBot'
import FigmaBot from './pages/agents/FigmaBot'
import RegsBot from './pages/agents/RegsBot'
import RequirementsBot from './pages/agents/RequirementsBot'
import TestingBot from './pages/agents/TestingBot'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="council" element={<Council />} />
        <Route path="agents">
          <Route path="regs" element={<RegsBot />} />
          <Route path="requirements" element={<RequirementsBot />} />
          <Route path="figma" element={<FigmaBot />} />
          <Route path="testing" element={<TestingBot />} />
          <Route path="dahs" element={<DAHSBot />} />
          <Route path="copilot" element={<CopilotBot />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
