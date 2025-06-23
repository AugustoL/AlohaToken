import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SurferList from './components/pages/Surfers';
import AddSurfSession from './components/pages/AddSurfSession';
import SurfSessions from './components/pages/SurfSessions';
import RegisterSurfer from './components/pages/RegisterSurfer';
import Surfer from './components/pages/Surfer';
import SurfSessionInfo from './components/pages/SurfSessionInfo';
import Navbar from './components/pages/Navbar';
import './styles/styles.css';
import './styles/rainbowkit.css';
function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/surfers" replace />} />
          <Route path="/surfers" element={<SurferList />} />
          <Route path="/sessions" element={<SurfSessions />} />
          <Route path="/add-surf-session" element={<AddSurfSession />} />
          <Route path="/register" element={<RegisterSurfer />} />
          <Route path="/surfer/:surferID" element={<Surfer />} />
          <Route path="/session/:sessionId" element={<SurfSessionInfo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;