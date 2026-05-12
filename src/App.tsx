import { Navigate, Route, Routes } from 'react-router-dom'

import { Audit } from '@/pages/Audit'
import { Home } from '@/pages/Home'
import { Results } from '@/pages/Results'
import Share from '@/pages/Share'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/results" element={<Results />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/audit/:slug" element={<Share />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
