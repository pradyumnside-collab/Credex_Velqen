import { Navigate, Route, Routes } from 'react-router-dom'

import { Audit } from '@/pages/Audit'
import { Home } from '@/pages/Home'
import { Results } from '@/pages/Results'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
