import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SurferList from './components/pages/Surfers';
import AddSurfSession from './components/pages/AddSurfSession';
import SurfSessions from './components/pages/SurfSessions';
import RegisterSurfer from './components/pages/RegisterSurfer';
import Surfer from './components/pages/Surfer';
import SurfSessionInfo from './components/pages/SurfSessionInfo';
import History from './components/pages/History';
import Navbar from './components/common/Navbar';
import NotificationDisplay from './components/common/NotificationDisplay';
import './styles/styles.css';
import './styles/rainbowkit.css';
import { useAppReady, useOnAppReady } from './hooks/useAppReady';
import { useWagmiConnection } from './hooks/useWagmiConnection';
import Loading from './components/common/Loading';
import ConnectWallet from './components/pages/ConnectWallet';

function App() {

  useOnAppReady(async () => {
    console.log('🎉 App is fully loaded and ready!');
  });

  const {fullyReady} = useAppReady();
  const { showConnectWallet, showLoading } = useWagmiConnection();

  return (
    <Router>
      {(!fullyReady || showLoading) ? (
      <Loading />
    ) : showConnectWallet ? (
      <ConnectWallet />
    ) : (
      <div className="App">
        <Navbar />
        <NotificationDisplay />
        <Routes>
          <Route path="/" element={<Navigate to="/surfers" replace />} />
          <Route path="/surfers" element={<SurferList />} />
            <Route path="/sessions" element={<SurfSessions />} />
            <Route path="/add-surf-session" element={<AddSurfSession />} />
            <Route path="/register" element={<RegisterSurfer />} />
            <Route path="/surfer/:surferID" element={<Surfer />} />
            <Route path="/session/:sessionID" element={<SurfSessionInfo />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;