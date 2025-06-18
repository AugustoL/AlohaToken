import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SurferList from './components/Surfers';
import AddSurfSession from './components/AddSurfSession';
import SurfSessions from './components/SurfSessions';
import AddSurfer from './components/AddSurfer';
import Surfer from './components/Surfer';
import SurfSessionInfo from './components/SurfSessionInfo';
import Navbar from './components/Navbar';
import './styles/styles.css';

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
          <Route path="/add-surfer" element={<AddSurfer />} />
          <Route path="/surfer/:surferID" element={<Surfer />} />
          <Route path="/session/:sessionId" element={<SurfSessionInfo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;