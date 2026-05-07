import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/results" element={<div>Results</div>} />
        <Route path="/audit/:slug" element={<div>Share</div>} />
      </Routes>
    </Router>
  );
}

export default App;
